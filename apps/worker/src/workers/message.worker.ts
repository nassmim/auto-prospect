import { EContactChannel, EWhatsAppErrorCode } from "@auto-prospect/shared";
import {
  connectWithCredentials,
  getWhatsAppJID,
  sendWhatsAppMessage,
  StoredAuthState,
} from "@auto-prospect/whatsapp";
import { Job } from "bullmq";
import { consumeCredit } from "../services/credit.service";
import { sendSms, sendVoiceMessage } from "../services/message.service";

interface SmsJob {
  recipientPhone: string;
  message: string;
  accountId: string;
  decryptedApiKey?: string; // Pre-validated by controller (user-initiated) or undefined (background job)
  metadata?: {
    huntId?: string;
    adId?: string;
    leadId?: string;
  };
}

export async function smsWorker(job: Job<SmsJob>) {
  const { recipientPhone, message, accountId, decryptedApiKey, metadata } =
    job.data;

  // ===== EXECUTION PHASE =====
  // Controller/orchestrator already validated credentials
  // Worker receives validated data and executes API call

  try {
    const result = await sendSms({
      to: recipientPhone,
      message,
      apiKey: decryptedApiKey!,
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
  } catch (error) {
    // ===== ERROR CLASSIFICATION =====
    // Classify API errors: retryable vs permanent

    // Re-throw for BullMQ to handle (will retry unless UnrecoverableError)
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
  scheduledDate?: string; // Optional: Schedule for future delivery
  apiKey?: string; // Pre-validated by controller (user-initiated) or undefined (background job)
  apiSecret?: string; // Pre-validated by controller (user-initiated) or undefined (background job)
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
    apiSecret,
    metadata,
  } = job.data;

  // ===== EXECUTION PHASE =====
  // Controller/orchestrator already validated credentials
  // Worker receives validated data and executes API call

  try {
    const result = await sendVoiceMessage({
      phoneNumbers: recipientPhone,
      tokenAudio,
      sender,
      scheduledDate,
      apiKey: apiKey!,
      apiSecret: apiSecret!,
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
    // ===== ERROR CLASSIFICATION =====
    // Classify API errors: retryable vs permanent

    // Re-throw for BullMQ to handle (will retry unless UnrecoverableError)
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
  accountId: string; // Always required
  credentials?: StoredAuthState; // Pre-validated by controller (user-initiated) or undefined (background job)
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
  // Controller/orchestrator already validated credentials
  // Worker receives validated data and executes API call

  try {
    // Step 1: Check if we have an active connection for this account
    let connection = activeConnections.get(accountId);

    if (!connection) {
      // Step 2: Create new connection with provided credentials
      const { socket, waitForConnection, cleanup } =
        await connectWithCredentials(credentials!);

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

    // Step 4: Send message using pooled connection
    const jid = getWhatsAppJID(recipientPhone);
    const result = await sendWhatsAppMessage(connection.socket, jid, message);

    if (!result.success) {
      throw new Error(
        result.errorCode || EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
      );
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
    // If connection failed, remove from pool so next attempt creates fresh connection
    if (activeConnections.has(accountId)) {
      const connection = activeConnections.get(accountId);
      if (connection) {
        connection.cleanup();
      }
      activeConnections.delete(accountId);
    }

    // ===== ERROR CLASSIFICATION =====
    // Classify API errors: retryable vs permanent

    // Re-throw for BullMQ to handle (will retry unless UnrecoverableError)
    throw error;
  }
}
