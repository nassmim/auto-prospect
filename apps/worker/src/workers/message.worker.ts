import { EContactChannel, EWhatsAppErrorCode } from "@auto-prospect/shared";
import {
  connectWithCredentials,
  getWhatsAppJID,
  markWhatsAppAsDisconnected,
  sendWhatsAppMessage,
  StoredAuthState,
} from "@auto-prospect/whatsapp";
import { Job, UnrecoverableError } from "bullmq";
import { consumeCredit } from "../services/credit.service";
import { sendSms, sendVoiceMessage } from "../services/message.service";

interface SmsJob {
  recipientPhone: string;
  message: string;
  decryptedApiKey: string; // Always provided by web app (validated and decrypted)
  metadata?: {
    huntId?: string;
    adId?: string;
    leadId?: string;
    accountId?: string;
  };
}

export async function smsWorker(job: Job<SmsJob>) {
  const { recipientPhone, message, decryptedApiKey, metadata } = job.data;

  // ===== EXECUTION PHASE =====
  // Web app already validated and decrypted credentials before queueing
  // Service layer handles error classification and throws appropriate errors
  // BullMQ catches errors: UnrecoverableError = fail, Error = retry

  const result = await sendSms({
    to: recipientPhone,
    message,
    apiKey: decryptedApiKey,
  });

  // Consume credit after successful send
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
  scheduledDate?: string; // Optional: Schedule for future delivery
  apiKey: string; // Always provided by web app (validated)
  apiSecret: string; // Always provided by web app (validated)
  metadata?: {
    huntId?: string;
    accountId?: string;
    adId?: string;
  };
}

export async function voiceWorker(job: Job<VoiceJob>) {
  const {
    recipientPhone,
    tokenAudio,
    sender,
    scheduledDate,
    apiKey,
    metadata,
  } = job.data;

  // ===== EXECUTION PHASE =====
  // Web app already validated credentials before queueing
  // Service layer handles error classification and throws appropriate errors
  // BullMQ catches errors: UnrecoverableError = fail, Error = retry

  const result = await sendVoiceMessage({
    phoneNumbers: recipientPhone,
    tokenAudio,
    sender,
    scheduledDate,
    apiKey,
  });

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
    data: result,
    metadata,
  };
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
  accountId: string; // Always required
  credentials: StoredAuthState; // Always provided by web app (validated)
  metadata?: {
    huntId?: string;
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
  const { recipientPhone, message, accountId, credentials, metadata } =
    job.data;

  // ===== EXECUTION PHASE =====
  // Web app already validated credentials before queueing
  // Error classification happens inline below
  // BullMQ catches errors: UnrecoverableError = fail, Error = retry

  try {
    // Step 1: Check if we have an active connection for this account
    let connection = activeConnections.get(accountId);

    if (!connection) {
      // Step 2: Create new connection with provided credentials
      const { socket, waitForConnection, cleanup } =
        await connectWithCredentials(credentials);

      // Wait for connection to establish
      const connected = await waitForConnection();
      if (!connected) {
        cleanup();
        // Mark session as disconnected in database
        await markWhatsAppAsDisconnected(accountId);
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

    // Step 4: Send message using pooled connection
    const jid = getWhatsAppJID(recipientPhone);
    const result = await sendWhatsAppMessage(connection.socket, jid, message);

    if (!result.success) {
      // ===== WHATSAPP ERROR HANDLING =====
      // Baileys library returns error codes, not HTTP responses
      // Each error needs specific handling strategy
      const errorCode =
        result.errorCode || EWhatsAppErrorCode.MESSAGE_SEND_FAILED;

      // PERMANENT FAILURES - Do not retry
      // These indicate configuration/data issues that won't resolve with retry
      if (
        errorCode === EWhatsAppErrorCode.RECIPIENT_INVALID ||
        errorCode === EWhatsAppErrorCode.SESSION_NOT_FOUND ||
        errorCode === EWhatsAppErrorCode.SESSION_EXPIRED ||
        errorCode === EWhatsAppErrorCode.ACCOUNT_NOT_FOUND
      ) {
        // Mark session as disconnected for session-related errors
        if (
          errorCode === EWhatsAppErrorCode.SESSION_EXPIRED ||
          errorCode === EWhatsAppErrorCode.SESSION_NOT_FOUND
        ) {
          await markWhatsAppAsDisconnected(accountId);
        }
        throw new UnrecoverableError(errorCode);
      }

      // TEMPORARY FAILURES - Let BullMQ retry
      // Connection issues, rate limits, etc.
      // TODO: Some errors might need custom retry strategies:
      // - CONNECTION_TIMEOUT: Maybe longer delay between retries?
      // - RATE_LIMITED: Custom backoff based on WhatsApp's rate limit window?
      throw new Error(errorCode);
    }

    // Step 5: Consume credit after successful send
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
    // Clean up failed connection from pool
    // Next retry will create a fresh connection
    if (activeConnections.has(accountId)) {
      const connection = activeConnections.get(accountId);
      if (connection) {
        connection.cleanup();
      }
      activeConnections.delete(accountId);
    }

    // Re-throw for BullMQ to handle
    throw error;
  }
}
