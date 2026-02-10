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

import { Job } from "bullmq";
import { createDrizzleAdmin, accounts, whatsappSessions } from "@auto-prospect/db";
import { EWhatsAppErrorCode } from "@auto-prospect/shared";
import { eq } from "drizzle-orm";
import {
  StoredAuthState,
  connectWithCredentials,
  sendWhatsAppMessage,
} from "@auto-prospect/whatsapp";

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

  if (!metadata?.accountId) {
    throw new Error("Account ID is required in metadata");
  }

  try {
    // Step 1: Get account from database
    const db = createDrizzleAdmin();
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, metadata.accountId),
      columns: { id: true, phone: true },
    });

    if (!account) {
      throw new Error(EWhatsAppErrorCode.ACCOUNT_NOT_FOUND);
    }

    // Step 2: Get WhatsApp session/credentials
    const session = await db.query.whatsappSessions.findFirst({
      where: eq(whatsappSessions.accountId, metadata.accountId),
    });

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
