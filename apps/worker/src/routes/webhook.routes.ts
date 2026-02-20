/**
 * Webhook Routes
 *
 * Handles incoming webhooks from external services (Lobstr, etc.)
 */

import { Request, Response, Router } from "express";
import { scrapingQueue } from "../queues";

const router = Router();

/**
 * Lobstr webhook endpoint
 * POST /api/webhooks/lobstr
 *
 * Receives notification from Lobstr when a scraping run completes
 */
router.post("/lobstr", async (req: Request, res: Response) => {
  try {
    const { id: runId } = req.body;

    if (!runId) {
      return res.status(400).json({
        error: "runId is required",
      });
    }

    // Dispatch to scraping queue for processing
    const job = await scrapingQueue.add(
      `lobstr-run-${runId}`,
      {
        runId,
      },
      {
        // Prevent duplicate processing of same run
        jobId: `lobstr-${runId}`,
      },
    );

    res.json({
      success: true,
      jobId: job.id,
      runId,
    });
  } catch (error) {
    console.error("Lobstr webhook error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
