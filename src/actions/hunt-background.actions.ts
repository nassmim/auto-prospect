"use server";

import { getUserPlan } from "@/actions/account.actions";
import { getAdsContactedByUser, getMatchingAds } from "@/actions/ad.actions";
import { ELeadStage } from "@/constants/enums";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { contactedAds } from "@/schema/ad.schema";
import { THunt } from "@/schema/hunt.schema";
import { leads } from "@/schema/lead.schema";
import { createDailyContactTracker, DailyContactTracker } from "@/services/daily-contact-tracker.service";
import { allocateAdsToChannels } from "@/services/channel-allocator.service";
import { consumeCredit } from "@/services/credit-consumption.service";

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
  dailyContactTracker: DailyContactTracker,
): Promise<void> {
  const concurrency = 5;
  const queue = [...hunts]; // Queue of jobs to be processed
  const inFlight: Promise<void>[] = []; // Currently processing jobs

  // While there's work left or jobs in flight
  while (queue.length || inFlight.length) {
    // Start new jobs while we're under capacity and have work
    while (inFlight.length < concurrency && queue.length) {
      const hunt = queue.shift()!;
      const huntJobPromise = contactAdsOwners(hunt, dbClient, dailyContactTracker)
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
  dailyContactTracker: DailyContactTracker,
): Promise<void> {
  const organizationId = hunt.organizationId;

  // Check if already at daily pacing limit
  if (dailyContactTracker.isAtLimit(hunt.id, hunt.dailyPacingLimit)) {
    return; // Skip this hunt - already reached daily limit
  }

  // Check if organization has an active subscription
  const plan = await getUserPlan(organizationId, dbClient);
  if (!plan) return;

  // Get ads already contacted by this organization
  const fetchedContactedAds = await getAdsContactedByUser(organizationId, {
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
        organizationId: organizationId,
        messageTypeId: 1, // TODO: Map from allocation.messageType to messageTypeId
      });

      // Create lead for CRM pipeline (with duplicate prevention)
      await dbClient.admin
        .insert(leads)
        .values({
          organizationId: organizationId,
          huntId: hunt.id,
          adId: allocation.adId,
          stage: ELeadStage.CONTACTE, // Already contacted via message
          position: 0, // Will be reordered by user in UI
        })
        .onConflictDoNothing(); // Unique constraint on (organizationId, adId)
    }

    // Check if we've hit the daily limit after this contact
    if (dailyContactTracker.isAtLimit(hunt.id, hunt.dailyPacingLimit)) {
      break; // Stop processing this hunt
    }
  }
}
