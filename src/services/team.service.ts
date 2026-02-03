import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";

/**
 * Gets all members of the current account
 */
export async function getTeamMembers() {
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
