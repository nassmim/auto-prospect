import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { getUseraccount } from "@/services/account.service";

/**
 * Gets all members of the current account
 */
export async function getTeamMembers() {
  const dbClient = await createDrizzleSupabaseClient();

  const account = await getUseraccount(dbClient, {
    columnsToKeep: { id: true },
  });

  const members = await dbClient.rls(async (tx) => {
    return tx.query.teamMembers.findMany({
      where: (table, { eq }) => eq(table.accountId, account.id),
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
