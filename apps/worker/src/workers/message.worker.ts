import { accounts, getDBAdminClient } from "@auto-prospect/db";
import {
  decryptCredentials,
  EContactChannel,
  ESmsErrorCode,
  EWhatsAppErrorCode,
  EVoiceErrorCode,
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
import {
  NonRetryableError,
  handleWorkerError,
} from "../utils/error-handler.utils";

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

  // ===== VALIDATION PHASE (Non-retryable errors) =====
  // These errors indicate permanent failures - don't retry
  const db = getDBAdminClient();
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { smsApiKey: true },
  });

  if (!account?.smsApiKey) {
    // Non-retryable: Missing API key is a configuration issue
    throw new NonRetryableError(
      "SMS API key not configured",
      ESmsErrorCode.API_KEY_REQUIRED,
    );
  }

  const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
  if (!encryptionKey) {
    // Non-retryable: Server misconfiguration
    throw new NonRetryableError(
      "Encryption key not configured",
      ESmsErrorCode.ENCRYPTION_KEY_MISSING,
    );
  }

  // ===== EXECUTION PHASE (May be retryable) =====
  // Network errors, rate limits, server errors should retry
  try {
    const decryptedApiKey = decryptCredentials(
      account.smsApiKey,
      encryptionKey,
    );

    // TODO: Add error handling using handleSmsApiResponse
    // Example:
    // const response = await fetch(SMS_API_URL, { ... });
    // const data = await response.json();
    // handleSmsApiResponse(response, data); // Will throw NonRetryableError or RetryableError
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
  } catch (error) {
    // ===== ERROR CLASSIFICATION =====
    // handleWorkerError will:
    // 1. Check if it's already a NonRetryableError → re-throw immediately (no retry)
    // 2. Try to extract error code from error message
    // 3. If error code is non-retryable → throw NonRetryableError (no retry)
    // 4. Otherwise → throw RetryableError (triggers BullMQ retry)
    //
    // TODO: Add SMSMobileAPI-specific error parsing before calling handleWorkerError
    // Example:
    // if (error.response?.status === 401) {
    //   throw new NonRetryableError('Invalid API key', ESmsErrorCode.API_KEY_INVALID);
    // }
    // if (error.response?.status === 400) {
    //   throw new NonRetryableError('Invalid phone number', ESmsErrorCode.PHONE_NUMBER_INVALID);
    // }

    // Use handleWorkerError as fallback for uncaught errors
    handleWorkerError(error, "SMS");
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

  // ===== VALIDATION PHASE (Non-retryable errors) =====
  if (!recipientPhone) {
    throw new NonRetryableError(
      "Recipient phone number is required",
      EVoiceErrorCode.PHONE_NUMBER_REQUIRED,
    );
  }

  if (!tokenAudio) {
    throw new NonRetryableError(
      "Audio token is required - pre-recorded audio must be provided",
      EVoiceErrorCode.AUDIO_TOKEN_REQUIRED,
    );
  }

  // ===== EXECUTION PHASE (May be retryable) =====
  try {
    // TODO: Add error handling using handleVoiceApiResponse
    // Example:
    // const response = await fetch(VOICE_API_URL, { ... });
    // const data = await response.json();
    // handleVoiceApiResponse(response, data); // Will throw NonRetryableError or RetryableError
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
    // ===== ERROR CLASSIFICATION =====
    // TODO: Add Voice Partner API-specific error parsing here
    // Example:
    // if (error.response?.status === 401) {
    //   throw new NonRetryableError('Invalid API key', EVoiceErrorCode.API_KEY_INVALID);
    // }

    // Use handleWorkerError as fallback for uncaught errors
    handleWorkerError(error, "Voice");
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

  // ===== VALIDATION PHASE (Non-retryable errors) =====
  const accountId = metadata?.accountId;
  if (!accountId) {
    throw new NonRetryableError(
      "Account ID is required in metadata",
      EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
    );
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
        // Non-retryable: Account doesn't exist
        throw new NonRetryableError(
          "Account not found",
          EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
        );
      }

      // Step 3: Get WhatsApp session/credentials
      const session = account.whatsappSession;
      if (!session || !session.credentials) {
        // Non-retryable: No WhatsApp session - user needs to reconnect via UI
        throw new NonRetryableError(
          "WhatsApp session not found - reconnect required",
          EWhatsAppErrorCode.SESSION_NOT_FOUND,
        );
      }

      // Parse stored credentials
      const credentials = JSON.parse(session.credentials) as StoredAuthState;

      // ===== EXECUTION PHASE (May be retryable) =====
      // Step 4: Create new connection
      const { socket, waitForConnection, cleanup } =
        await connectWithCredentials(credentials);

      // Wait for connection to establish
      const connected = await waitForConnection();
      if (!connected) {
        cleanup();
        // TODO: Determine if CONNECTION_TIMEOUT should be retryable
        // Could be temporary network issue - consider using RetryableError
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
      // TODO: Add error classification based on errorCode
      // Example:
      // if (result.errorCode === EWhatsAppErrorCode.RECIPIENT_INVALID) {
      //   throw new NonRetryableError('Invalid recipient', result.errorCode);
      // }
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

    // ===== ERROR CLASSIFICATION =====
    // TODO: Add WhatsApp-specific error parsing
    // Use handleWhatsAppApiResponse when calling WhatsApp Web API

    // Use handleWorkerError as fallback for uncaught errors
    handleWorkerError(error, "WhatsApp");
  }
}
