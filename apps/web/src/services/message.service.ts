/**
 * Message templating and rendering service
 * Handles variable replacement and message formatting
 */

import { CACHE_TAGS } from "@/lib/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { getUserAccount } from "@/services/account.service";
import { TDBWithTokenClient } from "@auto-prospect/db";
import { updateTag } from "next/cache";

export type TTemplateVariables = {
  titre_annonce?: string;
  prix?: string;
  marque?: string;
  modele?: string;
  annee?: string;
  ville?: string;
  vendeur_nom?: string;
};


/**
 * Fetch all templates for the user's account
 */
export async function getAccountTemplates() {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedAccountTemplates(account.id, dbClient);
}

/**
 * Internal cached function for account templates
 */
async function getCachedAccountTemplates(
  accountId: string,
  dbClient: TDBWithTokenClient,
) {
  "use cache";

  const { cacheTag } = await import("next/cache");
  const { CACHE_TAGS } = await import("@/lib/cache.config");

  cacheTag(CACHE_TAGS.templatesByAccount(accountId));

  const client = dbClient || (await createDrizzleSupabaseClient());

  try {
    // Fetch all templates for this account
    const templates = await client.rls(async (tx) => {
      return tx.query.messageTemplates.findMany({
        where: (table, { eq }) => eq(table.accountId, accountId),
        with: {
          account: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    });

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to fetch templates");
  }
}

export type MessageTemplate = Awaited<
  ReturnType<typeof import("@/services/message.service").getAccountTemplates>
>[number];

/**
 * Checks if the user has an SMS API key configured
 */
export async function hasSmsApiKeyAction(): Promise<boolean> {
  try {
    const account = await getUserAccount(undefined, {
      columnsToKeep: { id: true, smsApiKey: true },
    });

    return !!account.smsApiKey;
  } catch {
    return false;
  }
}

/**
 * Checks if the user is allowed to configure SMS Mobile API
 */
export async function isSmsApiAllowedAction(): Promise<boolean> {
  try {
    const account = await getUserAccount(undefined, {
      columnsToKeep: { id: true, smsMobileAPiAllowed: true },
    });

    return !!account.smsMobileAPiAllowed;
  } catch {
    return false;
  }
}

export const updateAccountTemplatesCache = async (
  dbClient: TDBWithTokenClient,
  accountId?: string,
) => {
  let accountIdToUse = accountId;
  if (!accountIdToUse) {
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });
    accountIdToUse = account.id;
  }

  updateTag(CACHE_TAGS.templatesByAccount(accountIdToUse));
};
