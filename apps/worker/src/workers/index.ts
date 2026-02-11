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
import { connection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { whatsappWorker } from "./whatsapp";
import { smsWorker } from "./sms";
import { voiceWorker } from "./voice";
import { scrapingWorker } from "./scraping";
import { dailyOrchestratorWorker } from "./daily-orchestrator";

export async function startAllWorkers() {
  const workers = [
    new Worker(QUEUE_NAMES.WHATSAPP, whatsappWorker, { connection }),
    new Worker(QUEUE_NAMES.SMS, smsWorker, { connection }),
    new Worker(QUEUE_NAMES.VOICE, voiceWorker, { connection }),
    new Worker(QUEUE_NAMES.SCRAPING, scrapingWorker, { connection }),
    new Worker(QUEUE_NAMES.DAILY_HUNTS_ORCHESTRATOR, dailyOrchestratorWorker, {
      connection,
    }),
  ];

  return workers;
}
