/**
 * Hunt Worker
 *
 * Processes automated prospect hunting operations.
 *
 * A "hunt" is Auto-Prospect's core automation feature:
 * 1. Robot fetches ads matching user criteria (LeBonCoin, etc.)
 * 2. Ads are allocated to communication channels (WhatsApp, SMS, Voice) based on:
 *    - Channel priority (user-configured)
 *    - Available credits per channel
 *    - Daily pacing limits (to avoid spam)
 * 3. This worker dispatches each contact to the appropriate channel queue
 * 4. Individual channel workers handle the actual message sending
 *
 * Flow:
 * Web app calls → /api/hunt/execute → hunt queue → THIS WORKER → individual channel queues
 *
 * This replaces the old "bulk" terminology with "hunt" to match the app's domain language.
 */

import { Job } from "bullmq";
import { whatsappQueue, smsQueue, voiceQueue } from "../queues";
import { jobIds, RETRY_CONFIG } from "../config";

/**
 * Contact represents a single prospect to be contacted during a hunt
 */
interface HuntContact {
  adId: string; // The ad being contacted
  recipientPhone: string; // Ad owner's phone number
  channel: "whatsapp_text" | "sms" | "ringless_voice"; // Allocated channel
  message: string; // Personalized message content
  senderPhone?: string; // Required for WhatsApp
  audioUrl?: string; // Optional for ringless voice (instead of TTS)
}

/**
 * Hunt job data structure
 */
interface HuntJob {
  huntId: string; // Hunt configuration ID
  accountId: string; // User's account ID
  contacts: HuntContact[]; // Array of prospects to contact
}

/**
 * Result of a single contact attempt
 */
interface ContactResult {
  adId: string;
  channel: string;
  status: "queued" | "failed";
  jobId?: string; // BullMQ job ID if successfully queued
  error?: string; // Error message if failed
}

/**
 * Hunt Worker Implementation
 *
 * Takes a list of contacts and dispatches each to the appropriate channel queue.
 *
 * Strategy:
 * - Each contact is processed independently
 * - Failures are tracked but don't block other contacts
 * - Returns summary of successes/failures
 * - Progress is updated as each contact is processed
 *
 * @param job - BullMQ job containing hunt data
 * @returns Summary with successes, failures, and individual results
 */
export async function huntWorker(job: Job<HuntJob>) {
  console.log(`Processing hunt job ${job.id} for hunt ${job.data.huntId} with ${job.data.contacts.length} contacts`);

  const { huntId, accountId, contacts } = job.data;

  const results: ContactResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each contact
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    try {
      let channelJobId: string | undefined;

      // Dispatch to appropriate channel queue based on allocation
      switch (contact.channel) {
        case "whatsapp_text": {
          if (!contact.senderPhone) {
            throw new Error("WhatsApp requires senderPhone");
          }

          const whatsappJob = await whatsappQueue.add(
            jobIds.hunt.whatsapp(huntId, contact.adId),
            {
              recipientPhone: contact.recipientPhone,
              senderPhone: contact.senderPhone,
              message: contact.message,
              // Metadata for tracking back to hunt
              metadata: {
                huntId,
                accountId,
                adId: contact.adId,
              },
            },
            RETRY_CONFIG.MESSAGE_SEND
          );

          channelJobId = whatsappJob.id;
          break;
        }

        case "sms": {
          const smsJob = await smsQueue.add(
            jobIds.hunt.sms(huntId, contact.adId),
            {
              recipientPhone: contact.recipientPhone,
              message: contact.message,
              metadata: {
                huntId,
                accountId,
                adId: contact.adId,
              },
            },
            RETRY_CONFIG.MESSAGE_SEND
          );

          channelJobId = smsJob.id;
          break;
        }

        case "ringless_voice": {
          const voiceJob = await voiceQueue.add(
            jobIds.hunt.voice(huntId, contact.adId),
            {
              recipientPhone: contact.recipientPhone,
              message: contact.message,
              audioUrl: contact.audioUrl,
              metadata: {
                huntId,
                accountId,
                adId: contact.adId,
              },
            },
            RETRY_CONFIG.MESSAGE_SEND
          );

          channelJobId = voiceJob.id;
          break;
        }

        default:
          throw new Error(`Unknown channel: ${contact.channel}`);
      }

      // Track success
      results.push({
        adId: contact.adId,
        channel: contact.channel,
        status: "queued",
        jobId: channelJobId,
      });
      successCount++;

    } catch (error) {
      // Track failure but continue processing other contacts
      console.error(`Failed to queue contact ${contact.adId}:`, error);

      results.push({
        adId: contact.adId,
        channel: contact.channel,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failureCount++;
    }

    // Update job progress (0-100)
    const progress = Math.round(((i + 1) / contacts.length) * 100);
    await job.updateProgress(progress);
  }

  console.log(
    `Hunt job ${job.id} completed: ${successCount} succeeded, ${failureCount} failed`
  );

  return {
    huntId,
    totalContacts: contacts.length,
    successCount,
    failureCount,
    results,
  };
}
