import { accounts, getDBAdminClient } from "@auto-prospect/db";
import {
  decryptCredentials,
  ESmsErrorCode,
  EWhatsAppErrorCode,
} from "@auto-prospect/shared";
import {
  connectWithCredentials,
  sendWhatsAppMessage,
  StoredAuthState,
} from "@auto-prospect/whatsapp";
import { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { sendSms } from "../services/message.service";

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

export async function smsWorker(job: Job<SmsJob>) {
  const { recipientPhone, message, accountId, metadata } = job.data;

  try {
    // Step 1: Fetch user's account to get encrypted SMS API key
    const db = getDBAdminClient();
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

    const decryptedApiKey = decryptCredentials(
      account.smsApiKey,
      encryptionKey,
    );

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

/**
 * Voice/Ringless Voicemail Worker
 *
 * Processes ringless voicemail delivery jobs using Voice Partner API.
 * Deposits pre-recorded audio messages directly to recipient voicemail.
 */

interface VoiceJob {
  recipientPhone: string; // Phone number(s) to call
  tokenAudio: string; // Required: Pre-recorded audio token from Voice Partner
  sender?: string; // Optional: Caller ID
  emailForNotification?: string; // Optional: Email for delivery notifications
  scheduledDate?: string; // Optional: Schedule for future delivery
  metadata?: {
    huntId?: string;
    accountId?: string;
    adId?: string;
  };
}

/**
 * Sends a voice message via Voice Partner API
 */
async function sendVoiceMessage(input: {
  phoneNumbers: string;
  tokenAudio: string;
  sender?: string;
  emailForNotification?: string;
  scheduledDate?: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}> {
  const apiKey = process.env.VOICE_PARTNER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "API key missing" };
  }

  const payload: Record<string, string> = {
    apiKey,
    tokenAudio: input.tokenAudio,
    phoneNumbers: input.phoneNumbers,
    emailForNotification:
      input.emailForNotification || "noreply@auto-prospect.com",
  };

  if (input.sender) {
    payload.sender = input.sender;
  }

  if (input.scheduledDate) {
    payload.scheduledDate = input.scheduledDate;
  }

  try {
    const response = await fetch(
      "https://api.voicepartner.fr/v1/campaign/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: (data.message as string) || "Voice Partner API error",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    };
  }
}

export async function voiceWorker(job: Job<VoiceJob>) {
  const {
    recipientPhone,
    tokenAudio,
    sender,
    emailForNotification,
    scheduledDate,
    metadata,
  } = job.data;

  // Validate required fields
  if (!recipientPhone) {
    throw new Error("Recipient phone number is required");
  }

  if (!tokenAudio) {
    throw new Error(
      "Audio token is required - pre-recorded audio must be provided",
    );
  }

  try {
    const result = await sendVoiceMessage({
      phoneNumbers: recipientPhone,
      tokenAudio,
      sender,
      emailForNotification,
      scheduledDate,
    });

    if (!result.success) {
      throw new Error(result.error || "Voice message send failed");
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: result.data,
      metadata,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * WhatsApp Worker
 *
 * Sends WhatsApp messages using the Baileys library (WhatsApp Web API).
 *
 * Process:
 * 1. Retrieve sender's WhatsApp account from database
 * 2. Initialize/restore Baileys connection (socket)
 * 3. Send text message
 * 4. Update message status in database
 * 5. Handle delivery receipts and errors
 *
 * Important:
 * - Each sender account has its own Baileys connection/session
 * - Sessions are stored in database (encrypted auth state)
 * - QR code pairing is done via web app UI, not here
 * - This worker only sends messages with existing connections
 */

interface WhatsAppJob {
  recipientPhone: string; // Phone in international format (e.g., "+33612345678")
  senderPhone: string; // Your WhatsApp Business account phone
  message: string; // Text content to send
  metadata?: {
    // Optional tracking metadata from hunt
    huntId?: string;
    accountId: string;
    adId?: string;
  };
}

export async function whatsappWorker(job: Job<WhatsAppJob>) {
  const { recipientPhone, senderPhone, message, metadata } = job.data;

  const accountId = metadata?.accountId;
  if (!accountId) {
    throw new Error("Account ID is required in metadata");
  }

  try {
    // Step 1: Get account from database
    const db = getDBAdminClient();
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      columns: { id: true, whatsappPhoneNumber: true },
      with: {
        whatsappSession: true,
      },
    });

    if (!account) {
      throw new Error(EWhatsAppErrorCode.ACCOUNT_NOT_FOUND);
    }

    // Step 2: Get WhatsApp session/credentials
    const session = account.whatsappSession;
    if (!session || !session.credentials) {
      throw new Error(EWhatsAppErrorCode.SESSION_NOT_FOUND);
    }

    // Parse stored credentials
    const credentials = JSON.parse(session.credentials) as StoredAuthState;

    // Step 3: Connect with existing credentials (no QR code)
    const { socket, waitForConnection, cleanup } =
      await connectWithCredentials(credentials);

    try {
      // Step 4: Wait for connection to establish
      const connected = await waitForConnection();
      if (!connected) {
        throw new Error(EWhatsAppErrorCode.CONNECTION_TIMEOUT);
      }

      // Step 5: Send message
      // Format phone: remove + and @s.whatsapp.net suffix
      const formattedPhone = recipientPhone.replace(/^\+/, "");
      const result = await sendWhatsAppMessage(socket, formattedPhone, message);

      if (!result.success) {
        throw new Error(
          result.errorCode || EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
        );
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        metadata,
      };
    } finally {
      cleanup();
    }
  } catch (error) {
    throw error;
  }
}
