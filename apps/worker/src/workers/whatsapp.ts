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
import { createDrizzleAdmin, accounts } from "@auto-prospect/db";
import { EWhatsAppErrorCode } from "@auto-prospect/shared";
import { eq } from "drizzle-orm";

// Import WhatsApp service functions from web app
// Note: These need to be accessible from the worker package
// TODO: Consider moving shared WhatsApp functions to a shared package
type StoredAuthState = {
  creds: string;
  keys: string;
};

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
  console.log(`Processing WhatsApp job ${job.id}:`, job.data);

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
    // Note: This requires importing the whatsapp service functions
    // For now, this is a placeholder showing the integration pattern
    // TODO: Import and use getWhatsAppSession, connectWithCredentials, sendWhatsAppMessage

    // const { credentials } = await getWhatsAppSession(metadata.accountId, { bypassRLS: true });
    //
    // if (!credentials) {
    //   throw new Error(EWhatsAppErrorCode.SESSION_NOT_FOUND);
    // }
    //
    // // Step 3: Connect with existing credentials (no QR code)
    // const { socket, waitForConnection, cleanup } = await connectWithCredentials(credentials);
    //
    // try {
    //   // Step 4: Wait for connection to establish
    //   const connected = await waitForConnection();
    //   if (!connected) {
    //     throw new Error(EWhatsAppErrorCode.CONNECTION_TIMEOUT);
    //   }
    //
    //   // Step 5: Send message
    //   // Format phone: remove + and @s.whatsapp.net suffix
    //   const formattedPhone = recipientPhone.replace(/^\+/, "");
    //   const result = await sendWhatsAppMessage(socket, formattedPhone, message);
    //
    //   if (!result.success) {
    //     throw new Error(result.errorCode || EWhatsAppErrorCode.MESSAGE_SEND_FAILED);
    //   }
    //
    //   return {
    //     success: true,
    //     timestamp: new Date().toISOString(),
    //     metadata,
    //   };
    // } finally {
    //   // Step 6: Always cleanup socket connection
    //   cleanup();
    // }

    // Placeholder implementation
    console.log(
      `Sending WhatsApp message from ${senderPhone} to ${recipientPhone}`,
      metadata ? `(Hunt: ${metadata.huntId}, Ad: ${metadata.adId})` : ""
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      timestamp: new Date().toISOString(),
      metadata,
    };
  } catch (error) {
    console.error(`WhatsApp job ${job.id} failed:`, error);
    throw error;
  }
}
