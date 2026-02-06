"use server";

import { z } from "zod";
import { sendSms } from "@/services/messaging.services";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { eq } from "drizzle-orm";
import { accounts } from "@/schema/account.schema";
import { encryptCredentials, decryptCredentials } from "@/utils/crypto.utils";

const sendSmsSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
});

export type SendSmsInput = z.infer<typeof sendSmsSchema>;

type SendSmsResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

/**
 * Sends an SMS message via SMS Mobile API using the user's own API key
 * Validates input, fetches user's API key from their account, and calls the messaging service
 */
export async function sendSmsAction(
  input: unknown,
): Promise<SendSmsResult> {
  // Validate input
  const validation = sendSmsSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  const { accountId, to, message } = validation.data;

  try {
    // Fetch user's account to get their SMS API key
    const client = await createDrizzleSupabaseClient();

    // Use admin client to bypass RLS (server action is already authenticated)
    const account = await client.admin.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      columns: { smsApiKey: true },
    });

    if (!account) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    if (!account.smsApiKey) {
      return {
        success: false,
        error: "SMS API key not configured. Please add your API key in account settings.",
      };
    }

    // Decrypt the API key before using it
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return {
        success: false,
        error: "Server configuration error",
      };
    }

    const decryptedApiKey = decryptCredentials(account.smsApiKey, encryptionKey);

    // Call the service with user's decrypted API key
    const result = await sendSms({
      to,
      message,
      apiKey: decryptedApiKey
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

const saveSmsApiKeySchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  apiKey: z.string().min(1, "Renseigne ta clé api"),
});

export type SaveSmsApiKeyInput = z.infer<typeof saveSmsApiKeySchema>;

type SaveSmsApiKeyResult = {
  success: boolean;
  error?: string;
};

/**
 * Checks if the user has an SMS API key configured
 */
export async function hasSmsApiKeyAction(
  accountId: string,
): Promise<boolean> {
  try {
    const client = await createDrizzleSupabaseClient();

    // Use admin client to bypass RLS (server action is already authenticated)
    const account = await client.admin.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      columns: { smsApiKey: true },
    });

    return !!account?.smsApiKey;
  } catch {
    return false;
  }
}

/**
 * Saves the user's SMS API key (encrypted) to their account
 */
export async function saveSmsApiKeyAction(
  input: unknown,
): Promise<SaveSmsApiKeyResult> {
  // Validate input
  const validation = saveSmsApiKeySchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  const { accountId, apiKey } = validation.data;

  try {
    const client = await createDrizzleSupabaseClient();

    // Encrypt the API key before storing
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return {
        success: false,
        error: "Server configuration error: encryption key missing",
      };
    }

    const encryptedApiKey = encryptCredentials(apiKey, encryptionKey);

    // Update the account with the encrypted API key
    // Use admin client to bypass RLS (server action is already authenticated)
    const result = await client.admin
      .update(accounts)
      .set({ smsApiKey: encryptedApiKey })
      .where(eq(accounts.id, accountId))
      .returning({ id: accounts.id });

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save API key",
    };
  }
}
