/**
 * Worker Orchestration
 *
 * Initializes and manages all BullMQ workers.
 *
 * Each worker processes jobs from its corresponding queue:
 * - WhatsApp Worker: Sends WhatsApp messages via Baileys
 * - SMS Worker: Sends SMS messages via provider
 * - Voice Worker: Sends ringless voice messages
 * - Scraping Worker: Processes Lobstr webhook and saves ads to database
 * - Daily Orchestrator Worker: Master orchestrator for daily automated hunts (handles entire hunt workflow)
 *
 * Workers run continuously, picking up jobs as they arrive in Redis queues.
 */

import { Worker } from "bullmq";
import { RETRY_CONFIG } from "../config/worker.config";
import { QUEUE_NAMES } from "../queues";
import { connection } from "../redis";
import { dailyOrchestratorWorker } from "./daily-orchestrator";
import { smsWorker, voiceWorker, whatsappWorker } from "./message.worker";
import { scrapingWorker } from "./scraping";

/**
 * How BullMQ Retry System Works:
 *
 * When a worker function throws an error:
 * 1. BullMQ catches the error
 * 2. If error is UnrecoverableError: Marks job as failed (no retry)
 * 3. Otherwise, checks if attempts < maxAttempts (from RETRY_CONFIG)
 * 4. If yes: Waits backoff delay, then retries
 * 5. If no: Marks job as failed
 *
 * Error handling pattern:
 * - UnrecoverableError: Permanent failures (invalid API key, missing data, etc.)
 * - Standard Error: Temporary failures that should retry (network issues, rate limits, etc.)
 *
 * Example in worker:
 * ```
 * import { UnrecoverableError } from 'bullmq';
 *
 * // Validation errors (don't retry)
 * if (!apiKey) {
 *   throw new UnrecoverableError('API key not configured');
 * }
 *
 * try {
 *   await sendSms(...);
 * } catch (error) {
 *   // Classify error
 *   if (error.response?.status === 401) {
 *     throw new UnrecoverableError('Invalid API key'); // Don't retry
 *   }
 *   throw error; // Retry network errors, timeouts, etc.
 * }
 * ```
 */
export async function startAllWorkers() {
  const workers = [
    new Worker(QUEUE_NAMES.WHATSAPP, whatsappWorker, {
      connection,
      ...RETRY_CONFIG.WHATSAPP_SEND,
    }),
    new Worker(QUEUE_NAMES.SMS, smsWorker, {
      connection,
      ...RETRY_CONFIG.MESSAGE_SEND,
    }),
    new Worker(QUEUE_NAMES.VOICE, voiceWorker, {
      connection,
      ...RETRY_CONFIG.MESSAGE_SEND,
    }),
    new Worker(QUEUE_NAMES.SCRAPING, scrapingWorker, {
      connection,
      ...RETRY_CONFIG.SCRAPING,
    }),
    new Worker(QUEUE_NAMES.DAILY_HUNTS_ORCHESTRATOR, dailyOrchestratorWorker, {
      connection,
    }),
  ];

  return workers;
}
