"use server";

import {
  createDrizzleSupabaseClient,
  TDBQuery,
} from "@/lib/drizzle/dbClient";

/**
 * Gets hunt daily pacing limit from database
 * Pattern 1 (Dynamic): Supports both user context (RLS) and admin context (background jobs)
 */
export async function getHuntDailyPacingLimit(
  huntId: string,
  bypassRLS: boolean = false,
): Promise<number | null> {
  const dbClient = await createDrizzleSupabaseClient();

  // Define query once, reuse for both modes
  const query = (tx: TDBQuery) =>
    tx.query.hunts.findFirst({
      where: (table, { eq }) => eq(table.id, huntId),
      columns: { dailyPacingLimit: true },
    });

  const hunt = bypassRLS
    ? await query(dbClient.admin)
    : await dbClient.rls(query);

  if (!hunt) {
    throw new Error(`Hunt not found: ${huntId}`);
  }

  return hunt.dailyPacingLimit;
}

/**
 * Gets channel priorities ordered by priority (lowest number = highest priority)
 * Pattern 1 (Dynamic): Supports both user context (RLS) and admin context (background jobs)
 */
export async function getChannelPriorities(bypassRLS: boolean = false) {
  const dbClient = await createDrizzleSupabaseClient();

  // Define query once, reuse for both modes
  const query = (tx: TDBQuery) =>
    tx.query.channelPriorities.findMany({
      orderBy: (table, { asc }) => [asc(table.priority)],
    });

  return bypassRLS ? await query(dbClient.admin) : await dbClient.rls(query);
}

/**
 * Gets hunt channel credits with remaining balance calculated
 * Returns Map of channel -> remaining credits
 * Pattern 1 (Dynamic): Supports both user context (RLS) and admin context (background jobs)
 */
export async function getHuntChannelCreditsMap(
  huntId: string,
  bypassRLS: boolean = false,
): Promise<Map<string, number>> {
  const dbClient = await createDrizzleSupabaseClient();

  // Define query once, reuse for both modes
  const query = (tx: TDBQuery) =>
    tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });

  const channelCreditsRaw = bypassRLS
    ? await query(dbClient.admin)
    : await dbClient.rls(query);

  // Calculate remaining credits per channel
  return new Map(
    channelCreditsRaw.map((cc) => [
      cc.channel as string,
      cc.creditsAllocated - cc.creditsConsumed,
    ]),
  );
}
