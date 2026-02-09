"use server";

import { CACHE_TAGS } from "@/lib/cache/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { teamMembers } from "@/schema/team.schema";
import { getUserAccount } from "@/services/account.service";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";

/**
 * Invites a new team member to the account
 */
export async function addTeamMember(name: string) {
  if (!name) {
    throw new Error("Name needed");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });

    const [teamMember] = await dbClient.rls(async (tx) =>
      tx
        .insert(teamMembers)
        .values({
          accountId: account.id,
          name,
        })
        .returning({ accountId: teamMembers.accountId }),
    );

    updateTag(CACHE_TAGS.teamMembersByAccount(teamMember.accountId));

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
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });

    await dbClient.rls(async (tx) =>
      tx
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.id, memberId),
            eq(teamMembers.accountId, account.id),
          ),
        ),
    );

    updateTag(CACHE_TAGS.teamMembersByAccount(account.id));

    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
}
