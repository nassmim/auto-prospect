/**
 * Message templating and rendering service
 * Handles variable replacement and message formatting
 */

import { EContactChannel } from "@/config/message.config";
import { pages } from "@/config/routes";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { creditTransactions } from "@/schema/credits.schema";
import { leadNotes } from "@/schema/lead.schema";
import { messages } from "@/schema/message.schema";
import { getUseraccount } from "@/services/account.service";
import { consumeCredit } from "@/services/credit.service";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
 * Renders a message template by replacing variable placeholders
 * Variables use the format {variable_name}
 */
export function renderTemplate(
  template: string,
  variables: TTemplateVariables,
): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    rendered = rendered.replace(new RegExp(placeholder, "g"), value || "");
  });

  return rendered;
}

/**
 * Generates a WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  // Remove non-digit characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Extracts template variables from lead data
 */
export function extractLeadVariables(lead: {
  ad: {
    title: string;
    price: number | null;
    model?: string | null;
    modelYear?: number | null;
    ownerName: string;
    brand?: { name: string } | null;
    location: { name: string };
  };
}): TTemplateVariables {
  return {
    titre_annonce: lead.ad.title,
    prix: lead.ad.price ? `${lead.ad.price.toLocaleString("fr-FR")} €` : "",
    marque: lead.ad.brand?.name || "",
    modele: lead.ad.model || "",
    annee: lead.ad.modelYear?.toString() || "",
    ville: lead.ad.location.name,
    vendeur_nom: lead.ad.ownerName,
  };
}

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
          channel: "whatsapp",
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

  const account = await getUseraccount(dbClient, {
    columnsToKeep: { id: true },
  });
  console.log("account", account);
  try {
    // Fetch all templates for this account
    const templates = await dbClient.rls(async (tx) => {
      return tx.query.messageTemplates.findMany({
        where: (table, { eq }) => eq(table.accountId, account.id),
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
