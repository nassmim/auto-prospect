/**
 * Scraping/Lobstr Worker
 *
 * Processes Lobstr webhook results and saves ads to the database.
 * Lobstr scrapes classified ad sites (LeBonCoin, etc.) and sends webhook
 * when scraping completes.
 */

import { Job } from "bullmq";
import { hunts } from "@auto-prospect/db";
import { eq } from "drizzle-orm";
import { handleLobstrWebhook } from "../services/lobstr.service";
import { getAdminClient } from "../services/db.service";

interface ScrapingJob {
  runId: string; // Lobstr run ID from webhook
  huntId?: string; // Optional: associate with specific hunt
}

export async function scrapingWorker(job: Job<ScrapingJob>) {
  const { runId, huntId } = job.data;

  if (!runId) {
    throw new Error("Lobstr run ID is required");
  }

  try {
    // Process Lobstr webhook and save ads
    await handleLobstrWebhook(runId);

    // Update hunt's last scan time if associated with a hunt
    if (huntId) {
      const db = getAdminClient();
      await db
        .update(hunts)
        .set({ lastScanAt: new Date() })
        .where(eq(hunts.id, huntId));
    }

    return {
      success: true,
      runId,
      huntId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw error;
  }
}
