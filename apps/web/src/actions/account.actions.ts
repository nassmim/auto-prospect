"use server";

import { pages } from "@/config/routes";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { getUserAccount } from "@/services/account.service";
import { accounts, eq } from "@auto-prospect/db";
import { TAccountSettings } from "@auto-prospect/shared";
import { revalidatePath } from "next/cache";

/**
 * Updates account settings (partial update)
 */
export async function updateAccountSettings(
  settings: Partial<TAccountSettings>,
) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUserAccount(dbClient, {
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
