import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { TBaseFiltersWithRelations } from "@/types/prospecting.types";

export const runAutomatedProspection = async () => {
  const dbClient = await createDrizzleSupabaseClient();

  // Gets the automated robots that searches for the ads matching our client robots
  const prospectingRobots = await fetchAllProspectingRobots(dbClient);

  if (prospectingRobots?.length === 0) return;

  // Send the messages to the ads owners
  await bulkSend(prospectingRobots);
};

/**
 * Fetches all active robots
 */
const fetchAllProspectingRobots = async (
  dbClient: TDBClient,
): Promise<TBaseFiltersWithRelations[]> => {
  return await dbClient.admin.query.baseFilters.findMany({
    where: (table, { eq }) => eq(table.isActive, true),
    with: {
      subTypes: true,
      brands: true,
    },
  });
};

/**
 * Processes multiple robots with controlled concurrency
 * Uses Promise.race pattern to avoid Vercel edge function timeouts
 */
async function bulkSend(robots: TBaseFiltersWithRelations[]): Promise<void> {
  const concurrency = 5;
  const queue = [...robots]; // Queue of jobs to be processed
  const inFlight: Promise<void>[] = []; // Currently processing jobs

  // While there's work left or jobs in flight
  while (queue.length || inFlight.length) {
    // Start new jobs while we're under capacity and have work
    while (inFlight.length < concurrency && queue.length) {
      const robot = queue.shift()!;
      const robotJobPromise = sendSMSToAds(robot)
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
