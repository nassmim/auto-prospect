/**
 * Jobs & Queue Management Routes
 *
 * Provides utilities for:
 * - Checking job status across all queues
 * - Monitoring queue statistics
 * - Debugging and operations
 *
 * These routes are helpful for:
 * - Dashboard displays showing queue health
 * - Tracking individual message delivery
 * - Operations/debugging
 */

import { Router, Request, Response } from "express";
import { queues, getAllQueuesStats, getQueueStats } from "../queues";

const router = Router();

// ============================================================================
// JOB STATUS ROUTES
// ============================================================================

/**
 * GET /jobs/:queue/:jobId
 *
 * Gets the status of a specific job in a queue
 *
 * Params:
 * - queue: "whatsapp" | "sms" | "voice" | "scraping" | "hunt"
 * - jobId: string - The BullMQ job ID
 *
 * Returns:
 * - id: string
 * - name: string - Job name
 * - data: object - Job input data
 * - state: "waiting" | "active" | "completed" | "failed" | "delayed"
 * - progress: number (0-100)
 * - failedReason: string | null - Error message if failed
 * - timestamp: number - When job was created
 * - processedOn: number - When job started processing
 * - finishedOn: number - When job completed
 *
 * Example:
 * ```
 * GET /api/jobs/whatsapp/job_123456
 * ```
 */
router.get("/:queue/:jobId", async (req: Request, res: Response) => {
  try {
    const { queue, jobId } = req.params;

    // Validate queue name
    const queueInstance = queues[queue as keyof typeof queues];
    if (!queueInstance) {
      return res.status(404).json({
        error: "Queue not found",
        validQueues: Object.keys(queues)
      });
    }

    // Get job from queue
    const job = await queueInstance.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        error: "Job not found",
        queue,
        jobId
      });
    }

    // Get job state and details
    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;

    res.json({
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress,
      failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    });
  } catch (error) {
    console.error("Get job status error:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
});

// ============================================================================
// QUEUE STATISTICS ROUTES
// ============================================================================

/**
 * GET /queues/stats
 *
 * Gets statistics for all queues
 *
 * Returns an array of queue stats:
 * - name: string - Queue name
 * - waiting: number - Jobs waiting to be processed
 * - active: number - Jobs currently being processed
 * - completed: number - Successfully completed jobs
 * - failed: number - Failed jobs
 * - delayed: number - Jobs scheduled for later
 *
 * Example:
 * ```
 * GET /api/queues/stats
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "queues": [
 *     {
 *       "name": "whatsapp",
 *       "waiting": 5,
 *       "active": 2,
 *       "completed": 1234,
 *       "failed": 12,
 *       "delayed": 0
 *     },
 *     ...
 *   ]
 * }
 * ```
 *
 * Use case: Dashboard showing overall system health
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getAllQueuesStats();
    res.json({ success: true, queues: stats });
  } catch (error) {
    console.error("Get queue stats error:", error);
    res.status(500).json({ error: "Failed to get queue stats" });
  }
});

/**
 * GET /queues/:queue/stats
 *
 * Gets statistics for a specific queue
 *
 * Params:
 * - queue: "whatsapp" | "sms" | "voice" | "scraping" | "hunt"
 *
 * Returns:
 * - name: string
 * - waiting: number
 * - active: number
 * - completed: number
 * - failed: number
 * - delayed: number
 *
 * Example:
 * ```
 * GET /api/queues/whatsapp/stats
 * ```
 *
 * Use case: Detailed monitoring of a specific channel
 */
router.get("/:queue/stats", async (req: Request, res: Response) => {
  try {
    const { queue } = req.params;

    // Validate queue name
    if (!queues[queue as keyof typeof queues]) {
      return res.status(404).json({
        error: "Queue not found",
        validQueues: Object.keys(queues)
      });
    }

    const stats = await getQueueStats(queue);
    res.json({ success: true, queue: stats });
  } catch (error) {
    console.error("Get queue stats error:", error);
    res.status(500).json({ error: "Failed to get queue stats" });
  }
});

export default router;
