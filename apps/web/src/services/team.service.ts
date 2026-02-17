import { createDrizzleSupabaseClient } from "@/lib/db";
import { getUserAccount } from "@/services/account.service";
import { getDBAdminClient, TDBWithTokenClient } from "@auto-prospect/db";

/**
 * Gets all members of the current account - CACHED
 */
export async function getTeamMembers(dbClient?: TDBWithTokenClient) {
  // This function can be cached
  // Will be invalidated when the user adds or removes a team member

  const client = dbClient || (await createDrizzleSupabaseClient());

  const account = await getUserAccount(client, {
    columnsToKeep: { id: true },
  });
  return getTeamMembersByAccountId(account.id);
}

/**
 * Internal cached function for team members
 */
async function getTeamMembersByAccountId(accountId: string) {
  "use cache";

  const { cacheTag } = await import("next/cache");
  const { CACHE_TAGS } = await import("@/lib/cache.config");

  cacheTag(CACHE_TAGS.teamMembersByAccount(accountId));

  const dbClient = getDBAdminClient();
  const members = await dbClient.query.teamMembers.findMany({
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

  return members;
}
