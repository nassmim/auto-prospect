import { EHuntStatus } from "@/config/hunt.config";
import { ELeadStage } from "@/config/lead.config";
import { HUNT_WITH_RELATIONS } from "@/constants/hunt.constants";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { contactedAds } from "@/schema/ad.schema";
import { THunt } from "@/schema/hunt.schema";
import { leads } from "@/schema/lead.schema";
import { getAdsContactedByUser, getMatchingAds } from "@/services/ad.service";
import { allocateAdsToChannels } from "@/services/channel-allocator.service";
import { consumeCredit } from "@/services/credit.service";
import { createDailyContactTracker } from "@/services/daily-contact-tracker.service";
import { getContactedLeads, getTotalLeads } from "@/services/lead.service";
import { getUserPlan } from "@/services/subscription.service";
import { THuntSummary } from "@/types/hunt.types";
import { TDailyContactTracker } from "@/types/message.types";

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

  // Process each allocation: send message, consume credit, track contact
  for (const allocation of allocations) {
    // TODO: Implement actual message sending based on allocation.channel
    // For now, we'll skip the actual send and just consume credits and track

    // Consume credit for this channel
    const creditResult = await consumeCredit({
      huntId: hunt.id,
      channel: allocation.channel,
      messageId: undefined, // Will be set when actual sending is implemented
      recipient: undefined, // Will be set when actual sending is implemented
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
          stage: ELeadStage.CONTACTED, // Already contacted via message
          position: 0, // Will be reordered by user in UI
        })
        .onConflictDoNothing(); // Unique constraint on (accountId, adId)
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
 * Fetches all hunts for the current user's account with channel credits
 */
export async function getAccountHunts() {
  const dbClient = await createDrizzleSupabaseClient();

  // Use RLS wrapper to ensure user can only see their account's hunts
  const huntsData = await dbClient.rls(async (tx) => {
    return tx.query.hunts.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: HUNT_WITH_RELATIONS,
    });
  });

  if (huntsData.length === 0) {
    return [];
  }

  // Fetch all channel credits for these hunts
  const huntIds = huntsData.map(({ id }) => id);

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

  // Attach credits to each hunt
  return huntsData.map((hunt) => ({
    ...hunt,
    channelCredits: creditsByHuntId.get(hunt.id) || [],
  }));
}

/**
 * Fetches a single hunt by ID with channel credits
 */
export async function getHuntById(huntId: string) {
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

  // Fetch channel credits separately
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

    // Get lead counts for each hunt
    const huntSummaries: THuntSummary[] = await Promise.all(
      huntsData.map(async (hunt) => {
        const [{ totalLeads }, { contactedLeadsCount }] = await Promise.all([
          getTotalLeads(hunt.id, dbClient),
          getContactedLeads(hunt.id, dbClient),
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
