"use server";

import { getUserPlan } from "@/actions/account.actions";
import { getAdsContactedByUser, getMatchingAds } from "@/actions/ad.actions";
import { ELeadStage } from "@/constants/enums";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { contactedAds } from "@/schema/ad.schema";
import { THunt } from "@/schema/hunt.schema";
import { leads } from "@/schema/lead.schema";

export const runDailyHunts = async () => {
  const dbClient = await createDrizzleSupabaseClient();

  // Gets the active hunts that search for ads matching user criteria
  const activeHunts = await fetchAllActiveHunts(dbClient);

  if (activeHunts?.length === 0) return;

  // Send messages to matching ad owners
  await bulkSend(activeHunts, dbClient);
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
async function bulkSend(hunts: THunt[], dbClient: TDBClient): Promise<void> {
  const concurrency = 5;
  const queue = [...hunts]; // Queue of jobs to be processed
  const inFlight: Promise<void>[] = []; // Currently processing jobs

  // While there's work left or jobs in flight
  while (queue.length || inFlight.length) {
    // Start new jobs while we're under capacity and have work
    while (inFlight.length < concurrency && queue.length) {
      const hunt = queue.shift()!;
      const huntJobPromise = contactAdsOwners(hunt, dbClient)
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
): Promise<void> {
  const organizationId = hunt.organizationId;

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

  // Send messages (whatsapp, audio, sms) to matching ads
  // TODO: Implement actual message sending

  // Track contacted ads and create leads for CRM
  await Promise.all([
    // Track in contactedAds (lightweight history)
    dbClient.admin.insert(contactedAds).values(
      matchingAds.map((ad) => ({
        adId: ad.id,
        organizationId: organizationId,
        messageTypeId: 1, // TODO: Use actual message type based on hunt settings
      })),
    ),

    // Create leads for CRM pipeline (with duplicate prevention)
    dbClient.admin
      .insert(leads)
      .values(
        matchingAds.map((ad, index) => ({
          organizationId: organizationId,
          huntId: hunt.id,
          adId: ad.id,
          stage: ELeadStage.CONTACTE, // Already contacted via message
          position: index,
        })),
      )
      .onConflictDoNothing(), // Unique constraint on (organizationId, adId)
  ]);
}
