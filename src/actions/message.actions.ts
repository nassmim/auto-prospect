"use server";

import { EContactChannel, TContactChannel } from "@/config/message.config";
import { pages } from "@/config/routes";
import {
  createDrizzleSupabaseClient,
  TANDperator,
} from "@/lib/drizzle/dbClient";
import { formatZodError } from "@/lib/validation";
import { messageTemplates } from "@/schema/message.schema";
import { getUseraccount, getUserSession } from "@/services/account.service";
import {
  getDefaultWhatsAppTemplate as getDefaultWhatsAppTemplateService,
  logWhatsAppMessage as logWhatsAppMessageService,
} from "@/services/message.service";
import { textTemplateSchema, voiceTemplateSchema } from "@/validation-schemas";
import { and, BinaryOperator, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Generic template creation function
 * Handles both text and voice templates with type-safe validation
 */
async function createTemplate<
  T extends typeof textTemplateSchema | typeof voiceTemplateSchema,
>(data: unknown, schema: T, channel: TContactChannel) {
  // Validate with Zod
  const parseResult = schema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data as T extends typeof textTemplateSchema
    ? z.infer<typeof textTemplateSchema>
    : z.infer<typeof voiceTemplateSchema>;

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const account = await getUseraccount(dbClient, {
      columnsToKeep: { id: true },
    });

    const accountId = account.id;

    // Determine the actual channel from validated data
    const actualChannel =
      "channel" in validatedData ? validatedData.channel : channel;

    // If setting as default, unset other defaults for this channel
    if (validatedData.isDefault) {
      await dbClient.rls((tx) =>
        tx
          .update(messageTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(messageTemplates.accountId, accountId),
              eq(messageTemplates.channel, actualChannel as TContactChannel),
            ),
          ),
      );
    }

    // Build template values based on type
    const templateValues =
      channel === EContactChannel.RINGLESS_VOICE
        ? {
            accountId,
            name: validatedData.name,
            channel: (validatedData as z.infer<typeof voiceTemplateSchema>)
              .channel,
            audioUrl: (validatedData as z.infer<typeof voiceTemplateSchema>)
              .audioUrl,
            audioDuration: (
              validatedData as z.infer<typeof voiceTemplateSchema>
            ).audioDuration,
            isDefault: validatedData.isDefault || false,
          }
        : {
            accountId,
            name: validatedData.name,
            channel: (validatedData as z.infer<typeof textTemplateSchema>)
              .channel,
            content: (validatedData as z.infer<typeof textTemplateSchema>)
              .content,
            isDefault: validatedData.isDefault || false,
          };

    // Create template
    const [template] = await dbClient.rls(async (tx) => {
      return tx.insert(messageTemplates).values(templateValues).returning();
    });

    revalidatePath(pages.templates.list);

    return { success: true, template };
  } catch (error) {
    console.error(`Error creating ${channel} template:`, error);
    throw new Error("Failed to create template");
  }
}

/**
 * Create a new text template
 */
export async function createTextTemplate(data: unknown) {
  return createTemplate(data, textTemplateSchema, EContactChannel.SMS);
}

/**
 * Create a new voice template
 */
export async function createVoiceTemplate(data: unknown) {
  return createTemplate(
    data,
    voiceTemplateSchema,
    EContactChannel.RINGLESS_VOICE,
  );
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    await dbClient.rls(async (tx) => {
      await tx
        .delete(messageTemplates)
        .where(eq(messageTemplates.id, templateId));
    });

    revalidatePath(pages.templates.list);

    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    throw new Error("Failed to delete template");
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    content?: string;
    isDefault?: boolean;
  },
) {
  // Will throw an error if session is empty
  await getUserSession();

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const updates: {
      name?: string;
      content?: string;
      isDefault?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.content !== undefined) updates.content = data.content.trim();
    if (data.isDefault !== undefined) {
      updates.isDefault = data.isDefault;

      // If setting as default, get template to unset others of same type/channel
      if (data.isDefault) {
        const template = await dbClient.rls(async (tx) => {
          return tx.query.messageTemplates.findFirst({
            where: eq(messageTemplates.id, templateId),
          });
        });

        if (template) {
          await dbClient.rls(async (tx) => {
            const conditions = [
              (
                table: typeof messageTemplates,
                { eq, and }: { eq: BinaryOperator; and: TANDperator },
              ) =>
                and(
                  eq(table.accountId, template.accountId),
                  eq(table.channel, template.channel),
                ),
            ];

            if (template.channel) {
              conditions.push(
                (
                  table: typeof messageTemplates,
                  { eq }: { eq: BinaryOperator },
                ) => eq(table.channel, template.channel!),
              );
            }

            await tx
              .update(messageTemplates)
              .set({ isDefault: false })
              .where(
                and(...conditions.map((c) => c(messageTemplates, { eq, and }))),
              );
          });
        }
      }
    }

    await dbClient.rls(async (tx) => {
      await tx
        .update(messageTemplates)
        .set(updates)
        .where(eq(messageTemplates.id, templateId));
    });

    revalidatePath(pages.templates.list);

    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}

/**
 * Get the default WhatsApp template for a lead's account
 * Server action wrapper for client-side calls
 */
export async function getDefaultWhatsAppTemplate(leadId: string) {
  return getDefaultWhatsAppTemplateService(leadId);
}

/**
 * Log a WhatsApp message attempt
 * Server action wrapper for client-side calls
 */
export async function logWhatsAppMessage(
  leadId: string,
  renderedMessage: string,
  templateId?: string,
) {
  return logWhatsAppMessageService(leadId, renderedMessage, templateId);
}
