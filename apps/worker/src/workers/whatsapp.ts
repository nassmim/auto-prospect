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
 *
 * Future enhancements:
 * - Audio messages
 * - Video messages
 * - Document sharing
 * - Media messages (images)
 */

import { Job } from "bullmq";
// TODO: Uncomment when ready to implement
// import { createDrizzleSupabaseClient, accounts } from "@auto-prospect/db";
// import { EWhatsAppErrorCode } from "@auto-prospect/shared";

interface WhatsAppJob {
  recipientPhone: string; // Phone in international format (e.g., "+33612345678")
  senderPhone: string; // Your WhatsApp Business account phone
  message: string; // Text content to send
  metadata?: {
    // Optional tracking metadata from hunt
    huntId?: string;
    accountId?: string;
    adId?: string;
  };
}

export async function whatsappWorker(job: Job<WhatsAppJob>) {
  console.log(`Processing WhatsApp job ${job.id}:`, job.data);

  const { recipientPhone, senderPhone, message, metadata } = job.data;

  try {
    // TODO: Implement Baileys WhatsApp logic
    //
    // Step 1: Get sender account from database
    // const dbClient = await createDrizzleSupabaseClient();
    // const account = await dbClient.admin.query.accounts.findFirst({
    //   where: (table, { eq }) => eq(table.phone, senderPhone),
    // });
    //
    // if (!account) {
    //   throw new Error(`WhatsApp account not found: ${senderPhone}`);
    // }
    //
    // Step 2: Initialize Baileys connection
    // - Load auth state from database (account.authState)
    // - Create socket connection
    // - Handle connection events (open, close, qr)
    //
    // Step 3: Send message
    // await sock.sendMessage(recipientPhone, { text: message });
    //
    // Step 4: Update message status in database
    // - Store message ID
    // - Track delivery status
    // - Link to hunt/ad if metadata provided
    //
    // Step 5: Handle errors
    // - Connection failures
    // - Invalid phone numbers
    // - Blocked/banned accounts
    // - Rate limiting

    console.log(
      `Sending WhatsApp message from ${senderPhone} to ${recipientPhone}`,
      metadata ? `(Hunt: ${metadata.huntId}, Ad: ${metadata.adId})` : ""
    );

    // Placeholder - replace with actual Baileys implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId: "placeholder-id", // Will be real Baileys message ID
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`WhatsApp job ${job.id} failed:`, error);

    // Re-throw to mark job as failed in BullMQ
    // BullMQ will automatically retry based on job configuration
    throw error;
  }
}
