import { getUserPlan } from "@/actions/account.actions";
import { getAdsContactedByUser, getMatchingAds } from "@/actions/ad.actions";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { contactedAds } from "@/schema/ad.schema";
import { TFiltersWithRelations } from "@/types/prospecting.types";

export const runAutomatedProspection = async () => {
  const dbClient = await createDrizzleSupabaseClient();

  // Gets the automated robots that searches for the ads matching our client robots
  const prospectingRobots = await fetchAllProspectingRobots(dbClient);

  if (prospectingRobots?.length === 0) return;

  // Send the messages to the ads owners
  await bulkSend(prospectingRobots, dbClient);
};

/**
 * Fetches all active robots
 */
const fetchAllProspectingRobots = async (
  dbClient: TDBClient,
): Promise<TFiltersWithRelations[]> => {
  return await dbClient.admin.query.baseFilters.findMany({
    where: (table, { eq }) => eq(table.isActive, true),
    with: {
      location: true,
      subTypes: true,
      brands: true,
    },
  });
};

/**
 * Processes multiple robots with controlled concurrency
 * Uses Promise.race pattern to avoid Vercel edge function timeouts
 */
async function bulkSend(
  robots: TFiltersWithRelations[],
  dbClient: TDBClient,
): Promise<void> {
  const concurrency = 5;
  const queue = [...robots]; // Queue of jobs to be processed
  const inFlight: Promise<void>[] = []; // Currently processing jobs

  // While there's work left or jobs in flight
  while (queue.length || inFlight.length) {
    // Start new jobs while we're under capacity and have work
    while (inFlight.length < concurrency && queue.length) {
      const robot = queue.shift()!;
      const robotJobPromise = contactAdsOwners(robot, dbClient)
        .catch(() => {})
        .finally(() => {
          // Remove this promise from inFlight when done
          const idx = inFlight.indexOf(robotJobPromise);
          if (idx !== -1) inFlight.splice(idx, 1);
        });
      inFlight.push(robotJobPromise);
    }
    // Wait for at least one job to finish before continuing
    await Promise.race(inFlight);
  }
}

/**
 * Processes a single user's auto-sender preferences
 * Fetches matching ads and sends messages within subscription limits
 */
async function contactAdsOwners(
  robot: TFiltersWithRelations,
  dbClient: TDBClient,
): Promise<void> {
  const accountId = robot.accountId;

  // Check if user has an active subscription
  const plan = await getUserPlan(accountId, dbClient);
  if (!plan) return;

  // Get ads already contacted by this user
  const fetchedContactedAds = await getAdsContactedByUser(accountId, {
    dbClient,
    bypassRLS: true,
  });
  const contactedAdsIds = fetchedContactedAds.map(({ adId }) => adId);

  // Fetch ads matching user preferences
  const matchingAds = await getMatchingAds(robot, {
    contactedAdsIds,
    dbClient,
    bypassRLS: true,
  });

  // Send messages (whatsapp, audio, sms) to matching ads
  // pass

  // Track sent messages in database
  // Will need to be truly implemented
  await dbClient.admin.insert(contactedAds).values({
    adId: "dfdsffds",
    accountId: "fdsfdsfqdsf",
    messageTypeId: 1,
  });
}
