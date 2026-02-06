"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { teamMembers } from "@/schema/team.schema";
import { getUseraccount } from "@/services/account.service";
import { pages } from "@/config/routes";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Invites a new team member to the account
 */
export async function addTeamMember(name: string) {
  if (!name) {
    throw new Error("Name needed");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUseraccount(dbClient, {
      columnsToKeep: { id: true },
    });

    await dbClient.rls(async (tx) => {
      await tx.insert(teamMembers).values({
        accountId: account.id,
        name,
      });
    });

    revalidatePath(pages.settings);

    return { success: true };
  } catch (error) {
    console.error("Error inviting team member:", error);
    throw error;
  }
}

/**
 * Removes a team member from the account
 */
export async function removeTeamMember(memberId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUseraccount(dbClient, {
      columnsToKeep: { id: true },
    });

    await dbClient.rls(async (tx) => {
      await tx
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.id, memberId),
            eq(teamMembers.accountId, account.id),
          ),
        );
    });

    revalidatePath(pages.settings);

    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
}
