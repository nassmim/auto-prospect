import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { getUserAccount } from "@/services/account.service";

/**
 * Gets all members of the current account - CACHED
 */
export async function getTeamMembers(dbClient?: TDBClient) {
  // If dbClient is provided, it's being called from settings page with existing client
  // In that case, get accountId first then use cached version
  if (!dbClient) {
    const client = await createDrizzleSupabaseClient();
    const account = await getUserAccount(client, {
      columnsToKeep: { id: true },
    });
    return getCachedTeamMembers(account.id);
  }

  // When called with dbClient (legacy), fetch without cache
  // This maintains backward compatibility for callers that need fresh data
  const members = await dbClient.rls(async (tx) => {
    return tx.query.teamMembers.findMany({
      with: {
        account: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  });

  return members;
}

/**
 * Internal cached function for team members
 */
async function getCachedTeamMembers(accountId: string) {
  "use cache";

  const { cacheTag } = await import("next/cache");
  const { CACHE_TAGS } = await import("@/lib/cache/cache.config");

  cacheTag(CACHE_TAGS.teamMembersByAccount(accountId));

  const dbClient = await createDrizzleSupabaseClient();

  const members = await dbClient.rls(async (tx) => {
    return tx.query.teamMembers.findMany({
      with: {
        account: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  });

  return members;
}
