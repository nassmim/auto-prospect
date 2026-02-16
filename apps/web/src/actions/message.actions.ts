"use server";

import { CACHE_TAGS } from "@/lib/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { formatZodError } from "@/lib/validation";
import { getUserAccount } from "@/services/account.service";
import { updateAccountTemplatesCache } from "@/services/message.service";
import { encryptCredentials } from "@/utils/crypto.utils";
import { textTemplateSchema, voiceTemplateSchema } from "@/validation-schemas";
import {
  saveSmsApiKeySchema,
  sendSmsSchema,
  TSaveSmsApiKeySchema,
  TSendSmsSchema,
} from "@/validation-schemas/settings.validation";
import type { BinaryOperator, TANDperator } from "@auto-prospect/db";
import { accounts, and, eq, messageTemplates } from "@auto-prospect/db";
import {
  EGeneralErrorCode,
  ESmsErrorCode,
  EVoiceErrorCode,
  TErrorCode,
  WORKER_ROUTES,
} from "@auto-prospect/shared";
import {
  EContactChannel,
  TContactChannel,
} from "@auto-prospect/shared/src/config/message.config";
import { updateTag } from "next/cache";
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
    const account = await getUserAccount(dbClient, {
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

    let templateValues = {
      accountId,
      name: validatedData.name,
      channel: validatedData.channel as TContactChannel,
      isDefault: validatedData.isDefault || false,
      audioUrl: "",
      audioDuration: 0,
      content: "",
    };

    // Build template values based on type
    templateValues =
      channel === EContactChannel.RINGLESS_VOICE
        ? {
            ...templateValues,
            audioUrl: (validatedData as z.infer<typeof voiceTemplateSchema>)
              .audioUrl,
            audioDuration: (
              validatedData as z.infer<typeof voiceTemplateSchema>
            ).audioDuration,
          }
        : {
            ...templateValues,
            content: (validatedData as z.infer<typeof textTemplateSchema>)
              .content,
          };

    // Create template
    const [template] = await dbClient.rls(async (tx) => {
      return tx.insert(messageTemplates).values(templateValues).returning();
    });

    updateTag(CACHE_TAGS.templatesByAccount(accountId));

    return { success: true, template };
  } catch {
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

    await updateAccountTemplatesCache(dbClient);

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

    await updateAccountTemplatesCache(dbClient);

    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}


type SendSmsResult = {
  success: boolean;
  errorCode?: TErrorCode;
  data?: Record<string, unknown>;
};

/**
 * Sends an SMS message via worker API
 * Web app does ALL validation
 */
export async function sendSmsAction(
  data: TSendSmsSchema,
): Promise<SendSmsResult> {
  // ===== VALIDATION PHASE =====
  // All validation happens HERE in the web app

  // Validate input schema
  const validation = sendSmsSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      errorCode: EGeneralErrorCode.VALIDATION_FAILED,
    };
  }

  const { to, message } = validation.data;

  try {
    // Fetch account and SMS API key
    const dbClient = await createDrizzleSupabaseClient();
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true, smsApiKey: true },
    });

    // Verify SMS API key exists
    if (!account.smsApiKey) {
      return {
        success: false,
        errorCode: ESmsErrorCode.API_KEY_REQUIRED,
      };
    }

    // Verify encryption key is configured
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error();
    }

    // Decrypt API key to validate it's properly encrypted
    let decryptedApiKey: string;
    try {
      const { decryptCredentials } = await import("@/utils/crypto.utils");
      decryptedApiKey = decryptCredentials(account.smsApiKey, encryptionKey);
    } catch {
      return {
        success: false,
        errorCode: ESmsErrorCode.API_KEY_INVALID,
      };
    }

    // ===== EXECUTION PHASE =====
    // Validation passed, call endpoint with ALL validated data
    const response = await fetch(
      `${process.env.WORKER_API_URL}${WORKER_ROUTES.PHONE_SMS}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_API_SECRET}`,
        },
        body: JSON.stringify({
          recipientPhone: to,
          message,
          decryptedApiKey, // Pass decrypted API key
          metadata: {
            accountId: account.id,
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        errorCode: result.error || ESmsErrorCode.MESSAGE_SEND_FAILED,
      };
    }

    return { success: true, data: { jobId: result.jobId } };
  } catch {
    return {
      success: false,
      errorCode: ESmsErrorCode.MESSAGE_SEND_FAILED,
    };
  }
}

type SaveSmsApiKeyResult = {
  success: boolean;
  errorCode?: TErrorCode;
};

/**
 * Saves the user's SMS API key (encrypted) to their account
 */
export async function saveSmsApiKeyAction(
  data: TSaveSmsApiKeySchema,
): Promise<SaveSmsApiKeyResult> {
  // Validate data
  const validation = saveSmsApiKeySchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      errorCode: EGeneralErrorCode.VALIDATION_FAILED,
    };
  }

  const { apiKey } = validation.data;

  try {
    const dbClient = await createDrizzleSupabaseClient();

    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true, smsApiKey: true },
    });

    // Encrypt the API key before storing
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error();
    }

    const encryptedApiKey = encryptCredentials(apiKey, encryptionKey);

    // Update the account with the encrypted API key
    // Use admin client to bypass RLS (server action is already authenticated)
    const updatedAccount = await dbClient.rls((tx) =>
      tx
        .update(accounts)
        .set({ smsApiKey: encryptedApiKey })
        .where(eq(accounts.id, account.id))
        .returning({ id: accounts.id }),
    );

    if (!updatedAccount || updatedAccount.length === 0) {
      return {
        success: false,
        errorCode: ESmsErrorCode.ACCOUNT_NOT_FOUND,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: ESmsErrorCode.API_KEY_SAVE_FAILED,
    };
  }
}

// =============================================================================
// RINGLESS VOICE MESSAGES
// =============================================================================

const sendVoiceMessageSchema = z.object({
  phoneNumbers: z.string().min(1, "Le numéro de téléphone est requis"),
  tokenAudio: z.string().min(1, "Le token audio est requis"),
  sender: z.string().optional(),
  scheduledDate: z.string().optional(),
});

export type SendVoiceMessageInput = z.infer<typeof sendVoiceMessageSchema>;

type SendVoiceMessageResult = {
  success: boolean;
  errorCode?: TErrorCode;
  data?: { jobId: string };
};

/**
 * Sends a ringless voice message via worker API
 * Web app does ALL validation
 */
export async function sendVoiceMessage(
  input: SendVoiceMessageInput,
): Promise<SendVoiceMessageResult> {
  // ===== VALIDATION PHASE =====
  // All validation happens HERE in the web app

  // Validate input schema
  const validation = sendVoiceMessageSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errorCode: EGeneralErrorCode.VALIDATION_FAILED,
    };
  }

  const { phoneNumbers, tokenAudio, sender, scheduledDate } = validation.data;

  try {
    // Get accountId from session
    const dbClient = await createDrizzleSupabaseClient();
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });

    // Verify Voice Partner API credentials are configured
    const apiKey = process.env.VOICE_PARTNER_API_KEY;
    const apiSecret = process.env.VOICE_PARTNER_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error();
    }

    // ===== EXECUTION PHASE =====
    // Validation passed, call endpoint with ALL validated data
    const response = await fetch(
      `${process.env.WORKER_API_URL}${WORKER_ROUTES.PHONE_RINGLESS_VOICE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_API_SECRET}`,
        },
        body: JSON.stringify({
          recipientPhone: phoneNumbers,
          tokenAudio,
          sender,
          scheduledDate,
          apiKey, // Pass API credentials
          apiSecret,
          metadata: {
            accountId: account.id,
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        errorCode: result.error || EVoiceErrorCode.MESSAGE_SEND_FAILED,
      };
    }

    return { success: true, data: { jobId: result.jobId } };
  } catch {
    return {
      success: false,
      errorCode: EVoiceErrorCode.MESSAGE_SEND_FAILED,
    };
  }
}
