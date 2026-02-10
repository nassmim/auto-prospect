import { Job } from "bullmq";
import { accounts } from "@auto-prospect/db";
import { decryptCredentials, ESmsErrorCode } from "@auto-prospect/shared";
import { eq } from "drizzle-orm";
import { getAdminClient } from "../services/db.service";

interface SmsJob {
  recipientPhone: string;
  message: string;
  accountId: string;
  metadata?: {
    huntId?: string;
    adId?: string;
    leadId?: string;
  };
}

/**
 * Sends SMS using SMSMobileAPI provider
 */
async function sendSms({
  to,
  message,
  apiKey,
}: {
  to: string;
  message: string;
  apiKey: string;
}) {
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

  if (!res.ok) throw new Error(ESmsErrorCode.MESSAGE_SEND_FAILED);

  return (await res.json()) as { message_id: string };
}

export async function smsWorker(job: Job<SmsJob>) {
  const { recipientPhone, message, accountId, metadata } = job.data;

  try {
    // Step 1: Fetch user's account to get encrypted SMS API key
    const db = getAdminClient();
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      columns: { smsApiKey: true },
    });

    if (!account?.smsApiKey) {
      throw new Error(ESmsErrorCode.API_KEY_REQUIRED);
    }

    // Step 2: Decrypt the API key
    const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error(ESmsErrorCode.ENCRYPTION_KEY_MISSING);
    }

    const decryptedApiKey = decryptCredentials(account.smsApiKey, encryptionKey);

    // Step 3: Call SMSMobileAPI
    const result = await sendSms({
      to: recipientPhone,
      message,
      apiKey: decryptedApiKey,
    });

    return {
      success: true,
      messageId: result.message_id,
      timestamp: new Date().toISOString(),
      metadata,
    };
  } catch (error) {
    throw error;
  }
}
