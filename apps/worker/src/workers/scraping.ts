/**
 * Scraping/Lobstr Worker
 *
 * Processes Lobstr webhook results and saves ads to the database.
 * Lobstr scrapes classified ad sites (LeBonCoin, etc.) and sends webhook
 * when scraping completes.
 */

import { Job } from "bullmq";
import { createDrizzleAdmin, hunts } from "@auto-prospect/db";
import { eq } from "drizzle-orm";

interface ScrapingJob {
  runId: string; // Lobstr run ID from webhook
  huntId?: string; // Optional: associate with specific hunt
}

/**
 * Handles Lobstr webhook by fetching and saving ads
 * Note: This duplicates the logic from apps/web/src/services/lobstr.service.ts
 * because lobstr.service has Next.js-specific imports
 */
async function handleLobstrWebhook(runId: string): Promise<void> {
  // Fetch ads from Lobstr API
  const response = await fetch(
    `https://api.lobstr.io/v1/results?cluster=${process.env.LOBSTR_CLUSTER}&run=${runId}&page=1&page_size=10000`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${process.env.LOBSTR_API_KEY}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Lobstr API error: ${response.status} ${response.statusText}`);
  }

  // TODO: Process and save ads to database
  // This requires importing ad mapping and insertion logic from lobstr.service.ts
  // which needs to be refactored into a shared package similar to whatsapp.service
  const data = await response.json() as { data: unknown[] };

  return Promise.resolve();
}

export async function scrapingWorker(job: Job<ScrapingJob>) {
  console.log(`Processing Scraping job ${job.id}:`, job.data);

  const { runId, huntId } = job.data;

  if (!runId) {
    throw new Error("Lobstr run ID is required");
  }

  try {
    // Process Lobstr webhook and save ads
    await handleLobstrWebhook(runId);

    // Update hunt's lastScanAt timestamp if huntId provided
    if (huntId) {
      const db = createDrizzleAdmin();
      await db
        .update(hunts)
        .set({ lastScanAt: new Date() })
        .where(eq(hunts.id, huntId));

      console.log(`Updated lastScanAt for hunt ${huntId}`);
    }

    return {
      success: true,
      runId,
      huntId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Scraping job ${job.id} failed:`, error);

    // TODO: Send admin alert on critical failures
    // This requires importing sendAlertToAdmin from web app

    throw error;
  }
}
