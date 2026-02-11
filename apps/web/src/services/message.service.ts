/**
 * Message templating and rendering service
 * Handles variable replacement and message formatting
 */

import { pages } from "@/config/routes";
import { CACHE_TAGS } from "@/lib/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { getUserAccount } from "@/services/account.service";
import { consumeCredit } from "@/services/credit.service";
import {
  creditTransactions,
  eq,
  leadNotes,
  messages,
  TDBWithTokenClient,
} from "@auto-prospect/db";
import { EContactChannel } from "@auto-prospect/shared/src/config/message.config";
import { revalidatePath, updateTag } from "next/cache";

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
 * Sends a message to a Slack channel via webhook
 */
export async function sendSlackMessage(message: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  if (!webhook) {
    throw new Error("SLACK_WEBHOOK_URL environment variable is not configured");
  }

  const payload = {
    text: message,
  };

  await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Get the default WhatsApp template for the account
 */
export async function getDefaultWhatsAppTemplate(leadId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    // First get the lead's account
    const lead = await dbClient.rls(async (tx) => {
      return tx.query.leads.findFirst({
        where: (table, { eq }) => eq(table.id, leadId),
        columns: {
          accountId: true,
        },
      });
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Get the default WhatsApp template
    const template = await dbClient.rls(async (tx) => {
      return tx.query.messageTemplates.findFirst({
        where: (table, { eq, and }) =>
          and(
            eq(table.accountId, lead.accountId),
            eq(table.channel, EContactChannel.WHATSAPP_TEXT),
            eq(table.isDefault, true),
          ),
      });
    });

    return template;
  } catch (error) {
    console.error("Error fetching WhatsApp template:", error);
    throw new Error("Failed to fetch WhatsApp template");
  }
}

/**
 * Log a WhatsApp message attempt
 * MVP: Just logs the message, doesn't actually send via API
 */
export async function logWhatsAppMessage(
  leadId: string,
  renderedMessage: string,
  templateId?: string,
) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get the lead's huntId first (needed for credit consumption)
    const lead = await dbClient.rls(async (tx) => {
      return await tx.query.leads.findFirst({
        where: (table, { eq }) => eq(table.id, leadId),
        columns: { huntId: true, assignedToId: true, accountId: true },
      });
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Consume credit first - if this fails, we don't log the message
    const creditResult = await consumeCredit({
      huntId: lead.huntId,
      channel: EContactChannel.WHATSAPP_TEXT,
    });

    if (!creditResult.success) {
      throw new Error(creditResult.error);
    }

    // Credit consumed successfully - now log the message
    const messageRecord = await dbClient.rls(async (tx) => {
      // Log message in messages table
      const [insertedMessage] = await tx
        .insert(messages)
        .values({
          leadId,
          templateId: templateId || null,
          channel: EContactChannel.WHATSAPP_TEXT,
          content: renderedMessage,
          status: "sent", // MVP: assume sent immediately
          sentAt: new Date(),
          sentById: lead.assignedToId || lead.accountId,
        })
        .returning();

      // Log activity
      await tx.insert(leadNotes).values({
        leadId,
        content: `Message WhatsApp envoyé`,
      });

      return insertedMessage;
    });

    // Update the credit transaction with the messageId for audit trail
    if (messageRecord?.id && creditResult.transaction?.id) {
      // Update the transaction with the messageId reference
      await dbClient.admin
        .update(creditTransactions)
        .set({
          referenceId: messageRecord.id,
          metadata: {
            messageId: messageRecord.id,
          },
        })
        .where(eq(creditTransactions.id, creditResult.transaction.id));
    }

    revalidatePath(pages.leads.detail(leadId));

    return { success: true };
  } catch (error) {
    console.error("Error logging WhatsApp message:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to log WhatsApp message",
    );
  }
}

/**
 * Fetch all templates for the user's account
 */
export async function getAccountTemplates() {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedAccountTemplates(account.id);
}

/**
 * Internal cached function for account templates
 */
async function getCachedAccountTemplates(accountId: string) {
  "use cache";

  const { cacheTag } = await import("next/cache");
  const { CACHE_TAGS } = await import("@/lib/cache.config");

  cacheTag(CACHE_TAGS.templatesByAccount(accountId));

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Fetch all templates for this account
    const templates = await dbClient.rls(async (tx) => {
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

/**
 * Send SMS via SMSMobileAPI
 */
export const sendSms = async ({
  to,
  message,
  apiKey,
}: {
  to: string;
  message: string;
  apiKey: string;
}) => {
  if (!apiKey) throw new Error("API key is required");

  const body = new URLSearchParams();
  body.set("apikey", apiKey);
  body.set("recipients", to);
  body.set("message", message);
  body.set("sendsms", "1");

  const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("Failed to send SMS");

  return res.json();
};

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
