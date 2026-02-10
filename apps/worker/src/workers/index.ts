/**
 * Worker Orchestration
 *
 * Initializes and manages all BullMQ workers.
 *
 * Each worker processes jobs from its corresponding queue:
 * - WhatsApp Worker: Sends WhatsApp messages via Baileys
 * - SMS Worker: Sends SMS messages via provider (Twilio, etc.)
 * - Voice Worker: Sends ringless voice messages
 * - Scraping Worker: Scrapes web content (future use)
 * - Hunt Worker: Orchestrates automated prospect hunting (dispatches to other workers)
 * - Active Hunts Worker: Fetches all active hunts and dispatches them to hunt queue
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
import { huntWorker } from "./hunt";
import { fetchActiveHuntsWorker } from "./fetch-active-hunts";

export async function startAllWorkers() {
  const workers = [
    new Worker(QUEUE_NAMES.WHATSAPP, whatsappWorker, { connection }),
    new Worker(QUEUE_NAMES.SMS, smsWorker, { connection }),
    new Worker(QUEUE_NAMES.VOICE, voiceWorker, { connection }),
    new Worker(QUEUE_NAMES.SCRAPING, scrapingWorker, { connection }),
    new Worker(QUEUE_NAMES.HUNT, huntWorker, { connection }),
    new Worker(QUEUE_NAMES.ACTIVE_HUNTS, fetchActiveHuntsWorker, { connection }),
  ];

  return workers;
}
