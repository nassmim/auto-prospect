"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { accounts, type accountSettings } from "@/schema/account.schema";
import { getUseraccount } from "@/services/account.service";
import { pages } from "@/config/routes";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Updates account settings (partial update)
 */
export async function updateaccountSettings(
  settings: Partial<accountSettings>,
) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUseraccount(dbClient, {
      columnsToKeep: { id: true, settings: true },
    });

    // Merge with existing settings
    const currentSettings = account.settings || {};
    const newSettings = { ...currentSettings, ...settings };

    await dbClient.rls(async (tx) => {
      await tx
        .update(accounts)
        .set({ settings: newSettings })
        .where(eq(accounts.id, account.id));
    });

    revalidatePath(pages.settings);

    return { success: true };
  } catch (error) {
    console.error("Error updating account settings:", error);
    throw error;
  }
}
