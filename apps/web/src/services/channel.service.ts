import { createDrizzleSupabaseClient } from "@/lib/db";
import { TDBQuery, TDBWithTokenClient } from "@auto-prospect/db";

/**
 * Gets hunt channel credits with remaining balance calculated
 * Returns Map of channel -> remaining credits
 * Pattern 1 (Dynamic): Supports both user context (RLS) and admin context (background jobs)
 */
export async function getHuntChannelCreditsMap(
  huntId: string,
  dbClient: TDBWithTokenClient,
  bypassRLS: boolean = false,
): Promise<Map<string, number>> {
  const client = dbClient || (await createDrizzleSupabaseClient());

  // Define query once, reuse for both modes
  const query = (tx: TDBQuery) =>
    tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });

  const channelCreditsRaw = bypassRLS
    ? await query(client.admin)
    : await client.rls(query);

  // Calculate remaining credits per channel
  return new Map(
    channelCreditsRaw.map((cc) => [
      cc.channel as string,
      cc.creditsAllocated - cc.creditsConsumed,
    ]),
  );
}
