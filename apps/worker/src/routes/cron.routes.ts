/**
 * Cron Routes
 *
 * Endpoints designed to be called by cron jobs for scheduled automation tasks.
 * These endpoints should be protected by authentication in production.
 */

import { Router, Request, Response } from "express";
import { dailyHuntsOrchestratorQueue } from "../queues";
import { EWorkerErrorCode } from "@auto-prospect/shared";

const router = Router();

/**
 * POST /cron/daily-hunts
 *
 * Triggers the daily hunts orchestrator
 *
 * This endpoint is called by a cron job (e.g., daily at 8 AM) to:
 * 1. Fetch all active hunts
 * 2. Find matching ads for each hunt
 * 3. Allocate ads to channels
 * 4. Personalize messages
 * 5. Dispatch to worker queues (WhatsApp, SMS, Voice)
 * 6. Track contacts and consume credits
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking the orchestrator execution
 * - triggeredAt: string - ISO timestamp
 *
 * Example cron configuration (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-hunts",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 * ```
 *
 * Example:
 * ```
 * POST /api/cron/daily-hunts
 * Authorization: Bearer <cron-secret>
 * ```
 */
router.post("/daily-hunts", async (_req: Request, res: Response) => {
  try {
    const triggeredAt = new Date().toISOString();

    // Add job to daily hunts orchestrator queue
    const job = await dailyHuntsOrchestratorQueue.add(
      "daily-hunts-orchestrator",
      {
        triggeredAt,
        source: "cron",
      },
      {
        // Prevent duplicate runs - only one daily orchestrator at a time
        jobId: `daily-hunts-${triggeredAt.split("T")[0]}`, // e.g., daily-hunts-2024-01-15
        removeOnComplete: 100,
        removeOnFail: 1000,
      }
    );

    res.json({
      success: true,
      jobId: job.id,
      triggeredAt,
    });
  } catch (error) {
    console.error("Daily hunts cron trigger error:", error);
    res.status(500).json({
      error: EWorkerErrorCode.HUNT_EXECUTION_FAILED,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
