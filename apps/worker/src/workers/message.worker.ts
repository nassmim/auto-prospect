import { accounts, getDBAdminClient } from "@auto-prospect/db";
import {
  decryptCredentials,
  EContactChannel,
  ESmsErrorCode,
  EWhatsAppErrorCode,
} from "@auto-prospect/shared";
import {
  connectWithCredentials,
  getWhatsAppJID,
  sendWhatsAppMessage,
  StoredAuthState,
} from "@auto-prospect/whatsapp";
import { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { consumeCredit } from "../services/credit.service";
import { sendSms, sendVoiceMessage } from "../services/message.service";

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

    // Step 4: Consume credit after successful send
    if (metadata?.huntId) {
      await consumeCredit({
        huntId: metadata.huntId,
        channel: EContactChannel.SMS,
        messageId: result.message_id,
        recipient: recipientPhone,
      });
    }

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

export async function voiceWorker(job: Job<VoiceJob>) {
  const { recipientPhone, tokenAudio, sender, scheduledDate, metadata } =
    job.data;

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
      scheduledDate,
    });

    if (!result.success) {
      throw new Error(result.error || "Voice message send failed");
    }

    // Consume credit after successful send
    if (metadata?.huntId) {
      await consumeCredit({
        huntId: metadata.huntId,
        channel: EContactChannel.RINGLESS_VOICE,
        recipient: recipientPhone,
      });
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
 * WhatsApp Worker with Connection Pooling
 *
 * Sends WhatsApp messages using the Baileys library (WhatsApp Web API).
 *
 * Connection Pooling Strategy:
 * - Maintains one persistent socket per account
 * - Reuses existing connections across multiple jobs
 * - Avoids WhatsApp anti-bot detection from frequent connect/disconnect
 * - Better performance by eliminating connection overhead
 *
 * Process:
 * 1. Check if account has active connection in pool
 * 2. If not, create new connection and add to pool
 * 3. Send message using pooled connection
 * 4. Keep connection alive for future messages
 *
 * Important:
 * - Each sender account has its own Baileys connection/session
 * - Sessions are stored in database (encrypted auth state)
 * - QR code pairing is done via web app UI, not here
 * - This worker only sends messages with existing connections
 */

interface WhatsAppJob {
  recipientPhone: string; // Phone in international format (e.g., "+33612345678")
  message: string; // Text content to send
  metadata?: {
    // Optional tracking metadata from hunt
    huntId?: string;
    accountId: string;
    adId?: string;
  };
}

// Connection pool: accountId -> socket
const activeConnections = new Map<
  string,
  {
    socket: Awaited<ReturnType<typeof connectWithCredentials>>["socket"];
    cleanup: () => void;
  }
>();

export async function whatsappWorker(job: Job<WhatsAppJob>) {
  const { recipientPhone, message, metadata } = job.data;

  const accountId = metadata?.accountId;
  if (!accountId) {
    throw new Error("Account ID is required in metadata");
  }

  try {
    // Step 1: Check if we have an active connection for this account
    let connection = activeConnections.get(accountId);

    if (!connection) {
      // Step 2: Get account from database
      const db = getDBAdminClient();
      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
        columns: { id: true },
        with: { whatsappSession: true },
      });

      if (!account) {
        throw new Error(EWhatsAppErrorCode.ACCOUNT_NOT_FOUND);
      }

      // Step 3: Get WhatsApp session/credentials
      const session = account.whatsappSession;
      if (!session || !session.credentials) {
        throw new Error(EWhatsAppErrorCode.SESSION_NOT_FOUND);
      }

      // Parse stored credentials
      const credentials = JSON.parse(session.credentials) as StoredAuthState;

      // Step 4: Create new connection
      const { socket, waitForConnection, cleanup } =
        await connectWithCredentials(credentials);

      // Wait for connection to establish
      const connected = await waitForConnection();
      if (!connected) {
        cleanup();
        throw new Error(EWhatsAppErrorCode.CONNECTION_TIMEOUT);
      }

      // Store connection in pool
      connection = { socket, cleanup };
      activeConnections.set(accountId, connection);

      // Listen for disconnections to clean up pool
      socket.ev.on("connection.update", (update) => {
        if (update.connection === "close") {
          activeConnections.delete(accountId);
          cleanup();
        }
      });
    }

    // Step 5: Send message using pooled connection
    // Format phone: remove + and @s.whatsapp.net suffix
    const jid = getWhatsAppJID(recipientPhone);
    const result = await sendWhatsAppMessage(connection.socket, jid, message);

    if (!result.success) {
      throw new Error(
        result.errorCode || EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
      );
    }

    // Step 6: Consume credit after successful send
    if (metadata?.huntId) {
      await consumeCredit({
        huntId: metadata.huntId,
        channel: EContactChannel.WHATSAPP_TEXT,
        recipient: recipientPhone,
      });
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      metadata,
    };
  } catch (error) {
    // If connection failed, remove from pool so next attempt creates fresh connection
    if (activeConnections.has(accountId)) {
      const connection = activeConnections.get(accountId);
      if (connection) {
        connection.cleanup();
      }
      activeConnections.delete(accountId);
    }
    throw error;
  }
}
