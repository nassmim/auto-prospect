import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";

/**
 * Gets all members of the current account
 */
export async function getTeamMembers(dbClient?: TDBClient) {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const members = await client.rls(async (tx) => {
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
