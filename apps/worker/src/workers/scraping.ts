/**
 * Scraping/Lobstr Worker
 *
 * Processes Lobstr webhook results and saves ads to the database.
 * Lobstr scrapes classified ad sites (LeBonCoin, etc.) and sends webhook
 * when scraping completes.
 */

import { Job, UnrecoverableError } from "bullmq";
import { handleLobstrWebhook } from "../services/lobstr.service";

interface ScrapingJob {
  runId: string; // Lobstr run ID from webhook
}

export async function scrapingWorker(job: Job<ScrapingJob>) {
  const { runId } = job.data;

  if (!runId) {
    throw new UnrecoverableError("Lobstr run ID is required");
  }

  // Process Lobstr webhook and save ads
  await handleLobstrWebhook(runId);

  return {
    success: true,
    runId,
    timestamp: new Date().toISOString(),
  };
}
