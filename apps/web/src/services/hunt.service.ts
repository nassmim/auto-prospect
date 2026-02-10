import { HUNT_WITH_RELATIONS } from "@/constants/hunt.constants";
import { CACHE_TAGS } from "@/lib/cache/cache.config";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { contactedAds } from "@/schema/ad.schema";
import { THunt } from "@/schema/hunt.schema";
import { leads } from "@/schema/lead.schema";
import { getUserAccount } from "@/services/account.service";
import { getAdsContactedByUser, getMatchingAds } from "@/services/ad.service";
import { allocateAdsToChannels } from "@/services/channel-allocator.service";
import { consumeCredit } from "@/services/credit.service";
import { createDailyContactTracker } from "@/services/daily-contact-tracker.service";
import { getContactedLeads, getTotalLeads } from "@/services/lead.service";
import { getUserPlan } from "@/services/subscription.service";
import { dispatchHuntMessages, WorkerHuntContact } from "@/services/worker-api.service";
import { renderMessageTemplate } from "@/utils/message.utils";
import { THuntSummary } from "@/types/hunt.types";
import { TDailyContactTracker } from "@/types/message.types";
import { EHuntStatus } from "@auto-prospect/shared/src/config/hunt.config";
import { ELeadStage } from "@auto-prospect/shared/src/config/lead.config";
import { EContactChannel } from "@auto-prospect/shared/src/config/message.config";
import { cacheTag, updateTag } from "next/cache";
import { eq } from "drizzle-orm";

export const runDailyHunts = async () => {
  const dbClient = await createDrizzleSupabaseClient();

  // Create daily contact tracker for this job run
  const dailyContactTracker = createDailyContactTracker();

  // Gets the active hunts that search for ads matching user criteria
  const activeHunts = await fetchAllActiveHunts(dbClient);

  if (activeHunts?.length === 0) return;

  // Send messages to matching ad owners
  await bulkSend(activeHunts, dbClient, dailyContactTracker);
};

/**
 * Fetches all active hunts (baseFilters)
 */
const fetchAllActiveHunts = async (dbClient: TDBClient): Promise<THunt[]> => {
  return await dbClient.admin.query.hunts.findMany({
    where: (table, { eq }) => eq(table.isActive, true),
    with: {
      location: true,
      subTypes: true,
      brands: true,
    },
  });
};

/**
 * Processes multiple hunts with controlled concurrency
 * Uses Promise.race pattern to avoid Vercel edge function timeouts
 */
async function bulkSend(
  hunts: THunt[],
  dbClient: TDBClient,
  dailyContactTracker: TDailyContactTracker,
): Promise<void> {
  const concurrency = 5;
  const queue = [...hunts]; // Queue of jobs to be processed
  const inFlight: Promise<void>[] = []; // Currently processing jobs

  // While there's work left or jobs in flight
  while (queue.length || inFlight.length) {
    // Start new jobs while we're under capacity and have work
    while (inFlight.length < concurrency && queue.length) {
      const hunt = queue.shift()!;
      const huntJobPromise = contactAdsOwners(
        hunt,
        dbClient,
        dailyContactTracker,
      )
        .catch(() => {})
        .finally(() => {
          // Remove this promise from inFlight when done
          const idx = inFlight.indexOf(huntJobPromise);
          if (idx !== -1) inFlight.splice(idx, 1);
        });
      inFlight.push(huntJobPromise);
    }
    // Wait for at least one job to finish before continuing
    await Promise.race(inFlight);
  }
}

/**
 * Processes a single hunt by ID: fetches hunt, finds matching ads, sends messages, creates leads
 * This is the exported version for API routes and workers
 */
export async function processSingleHunt(
  huntId: string,
  accountId: string
): Promise<{ messagesDispatched: number }> {
  const dbClient = await createDrizzleSupabaseClient();
  const dailyContactTracker = createDailyContactTracker();

  // Fetch the hunt with relations
  const hunt = await dbClient.admin.query.hunts.findFirst({
    where: (table, { eq }) => eq(table.id, huntId),
    with: {
      location: true,
      subTypes: true,
      brands: true,
    },
  });

  if (!hunt) {
    throw new Error(`Hunt not found: ${huntId}`);
  }

  if (hunt.accountId !== accountId) {
    throw new Error("Hunt does not belong to this account");
  }

  await contactAdsOwners(hunt, dbClient, dailyContactTracker);

  // Return the count of messages dispatched
  return {
    messagesDispatched: dailyContactTracker.getCount(huntId),
  };
}

/**
 * Processes a single hunt: finds matching ads, sends messages, creates leads
 */
async function contactAdsOwners(
  hunt: THunt,
  dbClient: TDBClient,
  dailyContactTracker: TDailyContactTracker,
): Promise<void> {
  const accountId = hunt.accountId;

  // Check if already at daily pacing limit
  if (dailyContactTracker.isAtLimit(hunt.id, hunt.dailyPacingLimit)) {
    return; // Skip this hunt - already reached daily limit
  }

  // Check if account has an active subscription
  const plan = await getUserPlan(accountId, dbClient);
  if (!plan) return;

  // Get ads already contacted by this account
  const fetchedContactedAds = await getAdsContactedByUser(accountId, {
    dbClient,
    bypassRLS: true,
  });
  const contactedAdsIds = fetchedContactedAds.map(({ adId }) => adId);

  // Fetch ads matching hunt criteria
  const matchingAds = await getMatchingAds(hunt, {
    contactedAdsIds,
    dbClient,
    bypassRLS: true,
  });

  if (matchingAds.length === 0) return;

  // Allocate ads to channels based on priority, credits, and daily limits
  const allocations = await allocateAdsToChannels({
    huntId: hunt.id,
    adIds: matchingAds.map((ad) => ad.id),
    dailyContactTracker,
    dbClient,
  });

  if (allocations.length === 0) {
    return; // No allocations possible (no credits or at daily limit)
  }

  // Get account info for WhatsApp sender phone
  const account = await dbClient.admin.query.accounts.findFirst({
    where: (table, { eq }) => eq(table.id, accountId),
    columns: {
      id: true,
      whatsappPhoneNumber: true,
    },
  });

  // Fetch message templates for this hunt
  const messageTemplates = await dbClient.admin.query.messageTemplates.findMany({
    where: (table, { eq, and }) =>
      and(
        eq(table.accountId, accountId),
        eq(table.isDefault, true)
      ),
  });

  // Build contact list with personalized messages
  const contacts: WorkerHuntContact[] = [];

  for (const allocation of allocations) {
    // Find the ad for this allocation
    const ad = matchingAds.find((a) => a.id === allocation.adId);
    if (!ad || !ad.phoneNumber) continue;

    // Get template for this channel
    const template = messageTemplates.find((t) => t.channel === allocation.channel);
    if (!template) continue;

    // Fetch ad relations for template variables
    const adWithRelations = await dbClient.admin.query.ads.findFirst({
      where: (table, { eq }) => eq(table.id, ad.id),
      with: {
        brand: true,
        location: true,
      },
    });

    if (!adWithRelations) continue;

    // Build template variables
    const variables = {
      titre_annonce: ad.title,
      prix: ad.price ? `${ad.price.toLocaleString("fr-FR")} €` : "",
      marque: adWithRelations.brand?.name || "",
      modele: ad.model || "",
      annee: ad.modelYear?.toString() || "",
      ville: adWithRelations.location.name,
      vendeur_nom: ad.ownerName,
    };

    // Render personalized message
    const personalizedMessage = renderMessageTemplate(template.body, variables);

    // Build contact for worker
    const contact: WorkerHuntContact = {
      adId: ad.id,
      recipientPhone: ad.phoneNumber,
      channel: allocation.channel as "whatsapp_text" | "sms" | "ringless_voice",
      message: personalizedMessage,
    };

    // Add senderPhone for WhatsApp
    if (allocation.channel === EContactChannel.WHATSAPP_TEXT) {
      if (!account?.whatsappPhoneNumber) {
        continue; // Skip if no WhatsApp phone configured
      }
      contact.senderPhone = account.whatsappPhoneNumber;
    }

    contacts.push(contact);
  }

  // Dispatch messages to worker if we have any contacts
  if (contacts.length > 0) {
    try {
      await dispatchHuntMessages(hunt.id, accountId, contacts);
    } catch (error) {
      return;
    }
  }

  // Consume credits and track contacts
  // NOTE: We consume credits upfront. If message send fails in worker,
  // the worker should notify us via webhook to refund credits (future work)
  for (const allocation of allocations) {
    // Consume credit for this channel
    const creditResult = await consumeCredit({
      huntId: hunt.id,
      channel: allocation.channel,
      messageId: undefined,
      recipient: undefined,
    });

    // Only track if credit consumption succeeded
    if (creditResult.success) {
      // Increment daily contact tracker
      dailyContactTracker.increment(hunt.id, allocation.channel);

      // Track in contactedAds (lightweight history)
      await dbClient.admin.insert(contactedAds).values({
        adId: allocation.adId,
        accountId: accountId,
        channel: allocation.channel,
      });

      // Create lead for CRM pipeline (with duplicate prevention)
      await dbClient.admin
        .insert(leads)
        .values({
          accountId: accountId,
          huntId: hunt.id,
          adId: allocation.adId,
          stage: ELeadStage.CONTACTED,
          position: 0,
        })
        .onConflictDoNothing();
    }

    // Check if we've hit the daily limit after this contact
    if (dailyContactTracker.isAtLimit(hunt.id, hunt.dailyPacingLimit)) {
      break; // Stop processing this hunt
    }
  }
}

/**
 * Gets hunt daily pacing limit from database
 * Pattern 1 (Dynamic): Supports both user context (RLS) and admin context (background jobs)
 */
export async function getHuntDailyPacingLimit(
  huntId: string,
  dbClient: TDBClient,
): Promise<number | null> {
  // Define query once, reuse for both modes
  const hunt = await dbClient.admin.query.hunts.findFirst({
    where: (table, { eq }) => eq(table.id, huntId),
    columns: { dailyPacingLimit: true },
  });

  if (!hunt) {
    throw new Error(`Hunt not found: ${huntId}`);
  }

  return hunt.dailyPacingLimit;
}

/**
 * Fetches hunt configurations (without credits) - CACHED
 * This is the cached version that only returns hunt config
 */
export async function getAccountHuntsConfig() {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedAccountHuntsConfig(account.id);
}

/**
 * Internal cached function for hunt configurations
 */
async function getCachedAccountHuntsConfig(accountId: string) {
  "use cache";

  cacheTag(CACHE_TAGS.huntsByAccount(accountId));

  const dbClient = await createDrizzleSupabaseClient();

  // Use RLS wrapper to ensure user can only see their account's hunts
  const huntsData = await dbClient.rls(async (tx) => {
    return tx.query.hunts.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: HUNT_WITH_RELATIONS,
    });
  });

  return huntsData;
}

/**
 * Fetches channel credits for multiple hunts - NOT CACHED
 * Called separately when credit display is needed
 */
export async function getHuntsChannelCredits(huntIds: string[]) {
  const dbClient = await createDrizzleSupabaseClient();

  const allChannelCredits = await dbClient.rls(async (tx) => {
    return tx.query.huntChannelCredits.findMany({
      where: (table, { inArray }) => inArray(table.huntId, huntIds),
    });
  });

  // Group credits by hunt ID
  const creditsByHuntId = new Map<string, typeof allChannelCredits>();
  for (const credit of allChannelCredits) {
    if (!creditsByHuntId.has(credit.huntId)) {
      creditsByHuntId.set(credit.huntId, []);
    }
    creditsByHuntId.get(credit.huntId)!.push(credit);
  }

  return creditsByHuntId;
}

/**
 * Fetches all hunts for the current user's account with channel credits
 * Combines cached config with fresh credits
 */
export async function getAccountHunts() {
  // Get cached hunt configs
  const huntsData = await getAccountHuntsConfig();

  if (huntsData.length === 0) {
    return [];
  }

  // Fetch fresh channel credits
  const huntIds = huntsData.map(({ id }) => id);
  const creditsByHuntId = await getHuntsChannelCredits(huntIds);

  // Attach credits to each hunt
  return huntsData.map((hunt) => ({
    ...hunt,
    channelCredits: creditsByHuntId.get(hunt.id) || [],
  }));
}

/**
 * Fetches hunt config by ID (without credits) - CACHED
 */
export async function getHuntConfigById(huntId: string) {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedHuntConfigById(huntId, account.id);
}

/**
 * Internal cached function for single hunt config
 */
async function getCachedHuntConfigById(huntId: string, accountId: string) {
  "use cache";

  cacheTag(CACHE_TAGS.hunt(huntId), CACHE_TAGS.huntsByAccount(accountId));

  const dbClient = await createDrizzleSupabaseClient();

  const hunt = await dbClient.rls(async (tx) => {
    return tx.query.hunts.findFirst({
      where: (table, { eq }) => eq(table.id, huntId),
      with: HUNT_WITH_RELATIONS,
    });
  });

  if (!hunt) {
    throw new Error("hunt not found");
  }

  return hunt;
}

/**
 * Fetches a single hunt by ID with channel credits
 * Combines cached config with fresh credits
 */
export async function getHuntById(huntId: string) {
  // Get cached hunt config
  const hunt = await getHuntConfigById(huntId);

  // Fetch fresh channel credits
  const dbClient = await createDrizzleSupabaseClient();
  const channelCreditsData = await dbClient.rls(async (tx) => {
    return tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });
  });

  return {
    ...hunt,
    channelCredits: channelCreditsData,
  };
}

/**
 * Fetches active hunts with summary data for dashboard
 */
export async function getActiveHunts(): Promise<THuntSummary[]> {
  const dbClient = await createDrizzleSupabaseClient();

  const hunts = await dbClient.rls(async (tx) => {
    // Fetch hunts with lead counts
    const huntsData = await tx.query.hunts.findMany({
      where: (table, { eq }) => eq(table.status, EHuntStatus.ACTIVE),
      orderBy: (table, { desc }) => [
        desc(table.lastScanAt),
        desc(table.createdAt),
      ],
      limit: 10, // Show top 10 active hunts
    });

    // Get lead counts for each hunt - pass transaction to avoid nested RLS calls
    const huntSummaries: THuntSummary[] = await Promise.all(
      huntsData.map(async (hunt) => {
        const [{ totalLeads }, { contactedLeadsCount }] = await Promise.all([
          getTotalLeads({ huntId: hunt.id, tx }),
          getContactedLeads({ huntId: hunt.id, tx }),
        ]);

        return {
          id: hunt.id,
          name: hunt.name,
          status: hunt.status,
          leadCount: totalLeads,
          contactedCount: contactedLeadsCount,
          lastScanAt: hunt.lastScanAt,
          createdAt: hunt.createdAt,
        };
      }),
    );

    return huntSummaries;
  });

  return hunts;
}

export const updateAccountHuntsCache = async (
  dbClient: TDBClient,
  huntId?: string,
  accountId?: string,
) => {
  let accountIdToUse = accountId;
  if (!accountIdToUse) {
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });
    accountIdToUse = account.id;
  }

  updateTag(CACHE_TAGS.huntsByAccount(accountIdToUse));
  if (huntId) updateTag(CACHE_TAGS.hunt(huntId));
};
