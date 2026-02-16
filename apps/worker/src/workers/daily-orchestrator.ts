/**
 * Daily Hunts Orchestrator Worker
 *
 * Master orchestrator that handles the ENTIRE daily hunt process.
 * This worker contains ALL the heavy processing logic
 *
 * Process:
 * 1. Fetch all active hunts from database
 * 2. For each hunt:
 *    - Fetch matching ads
 *    - Allocate ads to channels
 *    - Fetch message templates
 *    - Personalize messages
 *    - Dispatch to worker queues (WhatsApp/SMS/Voice)
 *    - Consume credits
 *    - Track contacted ads
 *    - Create leads
 * 3. Return summary report
 *
 * Triggered by: Cron job (e.g., daily at 8 AM)
 * Never triggered by: Users (users only create/edit hunts)
 */

import {
  accounts,
  ads,
  contactedAds,
  getDBAdminClient,
  hunts,
  leads,
  locations,
  messageTemplates,
  TDBAdminClient,
  THunt,
  TLocation,
} from "@auto-prospect/db";
import {
  decryptCredentials,
  EContactChannel,
  EHuntStatus,
  ELeadStage,
  TContactChannel,
} from "@auto-prospect/shared";
import { StoredAuthState } from "@auto-prospect/whatsapp";
import { Job } from "bullmq";
import { and, desc, eq, gte, inArray, lte, notInArray, sql } from "drizzle-orm";
import { jobIds, RETRY_CONFIG } from "../config";
import { smsQueue, voiceQueue, whatsappQueue } from "../queues";
import { allocateAdsToChannels } from "../services/channel.service";
import { personalizeMessage } from "../services/message.service";

interface DailyOrchestratorJob {
  triggeredAt: string;
  source: "cron" | "manual";
}

interface HuntResult {
  huntId: string;
  huntName: string;
  status: "success" | "failed";
  messagesDispatched: number;
  error?: string;
}

interface OrchestratorResult {
  totalHunts: number;
  successCount: number;
  failureCount: number;
  totalMessagesDispatched: number;
  duration: number;
  results: HuntResult[];
}

/**
 * Daily contact tracker (in-memory for this job run)
 * Its role is to ensure we don't contact more ads than the remaining credits
 * balance and than the limit set by the user (the user might not want to contact
 * too many ads if he does not have enough human ressources to handle them)
 */
function createDailyContactTracker() {
  const huntCounts = new Map<
    string,
    { total: number; channels: Map<string, number> }
  >();

  return {
    // Will be called every time an ad owner is contacted
    increment(huntId: string, channel?: string): number {
      let huntData = huntCounts.get(huntId);
      if (!huntData) {
        huntData = { total: 0, channels: new Map() };
        huntCounts.set(huntId, huntData);
      }
      huntData.total += 1;
      if (channel) {
        const channelCount = huntData.channels.get(channel) || 0;
        huntData.channels.set(channel, channelCount + 1);
      }
      return huntData.total;
    },
    getCount(huntId: string): number {
      return huntCounts.get(huntId)?.total || 0;
    },
    // will check if the hunt contacted more ads than the number set by the user
    isAtLimit(huntId: string, limit: number | null | undefined): boolean {
      if (limit === null || limit === undefined) return false;
      const count = huntCounts.get(huntId)?.total || 0;
      return count >= limit;
    },
  };
}

/**
 * Daily Orchestrator Worker Implementation
 */
export async function dailyOrchestratorWorker(
  job: Job<DailyOrchestratorJob>,
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  const db = getDBAdminClient();

  // Tracks how many ad owners are contacted for each user
  const dailyContactTracker = createDailyContactTracker();
  const results: HuntResult[] = [];

  try {
    // Fetch all active hunts
    const activeHunts = await db.query.hunts.findMany({
      where: eq(hunts.status, EHuntStatus.ACTIVE),
      with: {
        location: true,
        subTypes: true,
        brands: true,
      },
    });

    const totalHunts = activeHunts.length;

    if (totalHunts === 0) {
      return {
        totalHunts: 0,
        successCount: 0,
        failureCount: 0,
        totalMessagesDispatched: 0,
        duration: Date.now() - startTime,
        results: [],
      };
    }

    // Process hunts sequentially
    for (let i = 0; i < activeHunts.length; i++) {
      const hunt = activeHunts[i];

      try {
        const messagesDispatched = await processHunt(
          hunt,
          db,
          dailyContactTracker,
        );

        results.push({
          huntId: hunt.id,
          huntName: hunt.name,
          status: "success",
          messagesDispatched,
        });
      } catch (error) {
        results.push({
          huntId: hunt.id,
          huntName: hunt.name,
          status: "failed",
          messagesDispatched: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Update progress (0-100)
      const progress = Math.round(((i + 1) / totalHunts) * 100);
      await job.updateProgress(progress);
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;
    const totalMessagesDispatched = results.reduce(
      (sum, r) => sum + r.messagesDispatched,
      0,
    );

    return {
      totalHunts,
      successCount,
      failureCount,
      totalMessagesDispatched,
      duration,
      results,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(
      `Daily orchestrator failed after ${duration}ms: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Processes a single hunt: finds matching ads, sends messages, creates leads
 */
async function processHunt(
  hunt: THunt,
  db: TDBAdminClient,
  dailyContactTracker: ReturnType<typeof createDailyContactTracker>,
): Promise<number> {
  const { accountId, id: huntId } = hunt;

  // Check if we haven't already contacted more ads than requested by the user
  if (dailyContactTracker.isAtLimit(huntId, hunt.dailyPacingLimit)) {
    return 0;
  }

  // Get ads already contacted by this account
  const fetchedContactedAds = await db.query.contactedAds.findMany({
    where: eq(contactedAds.accountId, accountId),
    columns: { adId: true },
  });
  const contactedAdsIds = fetchedContactedAds.map((c) => c.adId);

  // Fetch ads matching hunt criteria
  const matchingAds = await getMatchingAds(hunt, {
    contactedAdsIds,
    excludeContactedAds: true,
    db,
  });

  if (matchingAds.length === 0) return 0;

  // ===== VALIDATION PHASE (for background jobs) =====
  // Get account info and validate credentials for all channels
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: {
      id: true,
      whatsappPhoneNumber: true,
      smsApiKey: true,
      fixedPhoneNumber: true,
    },
    with: {
      whatsappSession: {
        columns: { credentials: true },
      },
    },
  });

  // Determine which channels are disabled based on account configuration
  const disabledChannels: TContactChannel[] = [];

  // Validate and prepare credentials for each channel

  // SMS: decrypt API key
  let decryptedSmsApiKey: string | undefined;
  if (!account?.smsApiKey) {
    disabledChannels.push(EContactChannel.SMS);
  } else {
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      disabledChannels.push(EContactChannel.SMS);
    } else {
      try {
        decryptedSmsApiKey = decryptCredentials(account.smsApiKey, encryptionKey);
      } catch {
        disabledChannels.push(EContactChannel.SMS);
      }
    }
  }

  // WhatsApp: parse session credentials
  let whatsappCredentials: StoredAuthState | undefined;
  if (!account?.whatsappPhoneNumber || !account.whatsappSession?.credentials) {
    disabledChannels.push(EContactChannel.WHATSAPP_TEXT);
  } else {
    try {
      whatsappCredentials = JSON.parse(account.whatsappSession.credentials) as StoredAuthState;
    } catch {
      disabledChannels.push(EContactChannel.WHATSAPP_TEXT);
    }
  }

  // Voice: validate API credentials from environment
  const voiceApiKey = process.env.VOICE_PARTNER_API_KEY;
  const voiceApiSecret = process.env.VOICE_PARTNER_API_SECRET;
  if (!account?.fixedPhoneNumber || !voiceApiKey || !voiceApiSecret) {
    disabledChannels.push(EContactChannel.RINGLESS_VOICE);
  }

  // Allocate ads to channels based on priority, credits, and daily limits
  // This will skip disabled channels entirely
  const allocations = await allocateAdsToChannels({
    accountId,
    huntId,
    adIds: matchingAds.map((ad) => ad.id),
    dailyPacingLimit: hunt.dailyPacingLimit,
    dailyContactCount: dailyContactTracker.getCount(huntId),
    disabledChannels,
    db,
  });

  if (allocations.length === 0) return 0; // No allocations possible (no credits or at daily limit)

  // Fetch all default templates for this account (grouped by channel)
  const templates = await db.query.messageTemplates.findMany({
    where: and(
      eq(messageTemplates.accountId, accountId),
      eq(messageTemplates.isDefault, true),
    ),
  });

  // Create a map of channel -> template for quick lookup
  const templatesByChannel = new Map(
    templates.map((t) => [t.channel as string, t]),
  );

  let messagesDispatched = 0;

  // Process each allocation
  for (const allocation of allocations) {
    // Find the ad for this allocation
    const ad = matchingAds.find((a) => a.id === allocation.adId);

    if (!ad || !ad.phoneNumber) continue;

    const {
      id: adId,
      title,
      phoneNumber: recipientPhone,
      price,
      brand,
      model,
      modelYear,
      location,
      ownerName,
    } = ad;

    // Get template for this channel
    const template = templatesByChannel.get(allocation.channel);
    if (!template) continue;

    // Dispatch to appropriate queue based on channel
    const channel = allocation.channel;

    let personalizedMessage = "";
    if (channel !== EContactChannel.RINGLESS_VOICE) {
      // Build template variables
      const variables = {
        titre_annonce: title,
        prix: price ? `${price.toLocaleString("fr-FR")} €` : "",
        marque: brand?.name || "",
        modele: model || "",
        annee: modelYear?.toString() || "",
        ville: location?.name || "",
        vendeur_nom: ownerName,
      };

      // Render personalized message
      personalizedMessage = personalizeMessage(template.content!, variables);
    }

    try {
      switch (channel) {
        case EContactChannel.WHATSAPP_TEXT:
          // WhatsApp credentials validated above
          await whatsappQueue.add(
            jobIds.hunt.whatsapp(huntId, adId),
            {
              recipientPhone,
              message: personalizedMessage,
              accountId,
              credentials: whatsappCredentials!,
              metadata: { huntId, adId },
            },
            RETRY_CONFIG.MESSAGE_SEND,
          );
          break;

        case EContactChannel.SMS:
          // SMS API key validated and decrypted above
          await smsQueue.add(
            jobIds.hunt.sms(huntId, adId),
            {
              recipientPhone,
              message: personalizedMessage,
              accountId,
              decryptedApiKey: decryptedSmsApiKey!,
              metadata: { huntId, adId },
            },
            RETRY_CONFIG.MESSAGE_SEND,
          );
          break;

        case EContactChannel.RINGLESS_VOICE:
          // Voice API credentials validated above
          await voiceQueue.add(
            jobIds.hunt.voice(huntId, adId),
            {
              recipientPhone,
              tokenAudio: template.audioUrl,
              sender: account!.fixedPhoneNumber!,
              apiKey: voiceApiKey!,
              apiSecret: voiceApiSecret!,
              metadata: { huntId, accountId, adId },
            },
            RETRY_CONFIG.MESSAGE_SEND,
          );
          break;
      }

      // Track contact
      dailyContactTracker.increment(huntId, channel);

      // Track in contactedAds
      await db.insert(contactedAds).values({
        adId,
        accountId,
        channel,
      });

      // Create lead
      await db
        .insert(leads)
        .values({
          accountId,
          huntId,
          adId,
          stage: ELeadStage.CONTACTED,
          position: 0,
        })
        .onConflictDoNothing();

      messagesDispatched++;
    } catch {
      continue;
    }
  }

  return messagesDispatched;
}

/**
 * Fetches ads matching hunt filters
 */
export async function getMatchingAds(
  robot: THunt,
  {
    contactedAdsIds = [],
    excludeContactedAds = true,
    db,
  }: {
    contactedAdsIds?: string[];
    excludeContactedAds?: boolean;
    db?: TDBAdminClient;
    bypassRLS?: boolean;
  } = {},
) {
  const {
    priceMin,
    priceMax,
    isLowPrice,
    hasBeenReposted,
    hasBeenBoosted,
    isUrgent,
    modelYearMin,
    modelYearMax,
    mileageMin,
    mileageMax,
    priceHasDropped,
    radiusInKm,
    brands,
    typeId,
    subTypes,
    location,
  } = robot;

  const client = db || getDBAdminClient();

  // Get locations within radius
  const nearbyLocationsIds = await findNearbyLocations({
    db: client,
    location,
    radiusInKm,
  });

  return await client.query.ads.findMany({
    where: and(
      // Either exclude or take only ads already contacted
      contactedAdsIds.length > 0
        ? excludeContactedAds
          ? notInArray(ads.id, contactedAdsIds)
          : inArray(ads.id, contactedAdsIds)
        : undefined,

      // Ads whose lat/lng are within the radius
      inArray(ads.locationId, nearbyLocationsIds),

      eq(ads.typeId, typeId),

      subTypes && subTypes.length > 0
        ? inArray(
            ads.subtypeId,
            subTypes.map(({ subTypeId }) => subTypeId),
          )
        : undefined,

      gte(ads.price, priceMin),
      priceMax != null ? lte(ads.price, priceMax) : undefined,

      eq(ads.isLowPrice, isLowPrice),
      eq(ads.hasBeenReposted, hasBeenReposted),
      eq(ads.hasBeenBoosted, hasBeenBoosted),
      eq(ads.isUrgent, isUrgent),
      eq(ads.priceHasDropped, priceHasDropped),

      gte(ads.modelYear, modelYearMin),
      modelYearMax != null ? lte(ads.modelYear, modelYearMax) : undefined,

      gte(ads.mileage, mileageMin),
      mileageMax != null ? lte(ads.mileage, mileageMax) : undefined,

      brands && brands.length > 0
        ? inArray(
            ads.brandId,
            brands.map(({ brandId }) => brandId),
          )
        : undefined,
    ),
    orderBy: desc(ads.createdAt),
    with: {
      brand: true,
      location: true,
    },
  });
}

/**
 * Find all locations within a radius of a location
 * Copied from ad.service.ts to avoid cross-package dependencies
 */
async function findNearbyLocations({
  db,
  locationId,
  location,
  radiusInKm,
}: {
  db: TDBAdminClient;
  locationId?: number;
  location?: TLocation;
  radiusInKm: number;
}): Promise<number[]> {
  let latCenter: number, lngCenter: number;
  if (location) {
    latCenter = location.lat;
    lngCenter = location.lng;
  } else {
    const fetchedLocationById = await db.query.locations.findFirst({
      where: eq(locations.id, locationId!),
      columns: { lat: true, lng: true },
    });
    latCenter = fetchedLocationById!.lat;
    lngCenter = fetchedLocationById!.lng;
  }

  const nearbyLocations = await db.query.locations.findMany({
    where: sql`ST_DWithin(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(${lngCenter}, ${latCenter})::geography,
      ${radiusInKm * 1000}
    )`,
  });

  const locationsIds = nearbyLocations.map(({ id }) => id);

  return locationsIds;
}
