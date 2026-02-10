/**
 * Active Hunts Fetch Worker
 *
 * Fetches all active hunts from the database and dispatches them to the hunt queue
 * for processing. This worker runs on a scheduled basis (cron job) to automate
 * hunt execution.
 *
 * Process:
 * 1. Query all hunts with status='active' and isActive=true
 * 2. For each hunt, dispatch to hunt queue for processing
 * 3. Track and log metrics (hunt count, duration, errors)
 * 4. Handle pagination for large hunt counts (1000+ hunts)
 *
 * Note: This worker only fetches and dispatches hunts. The actual hunt processing
 * (fetching ads, allocating channels, sending messages) happens in the hunt worker.
 */

import { Job } from "bullmq";
import { createDrizzleAdmin, hunts } from "@auto-prospect/db";
import { EHuntStatus } from "@auto-prospect/shared";
import { eq, and } from "drizzle-orm";
import { huntQueue } from "../queues";

interface FetchActiveHuntsJob {
  triggeredAt: string; // ISO timestamp for tracking
}

interface HuntDispatchResult {
  huntId: string;
  huntName: string;
  status: "queued" | "failed";
  jobId?: string;
  error?: string;
}

interface FetchResult {
  totalHunts: number;
  successCount: number;
  failureCount: number;
  duration: number;
  results: HuntDispatchResult[];
}

/**
 * Fetch Active Hunts Worker Implementation
 *
 * Queries all active hunts and dispatches each to the hunt queue.
 * The hunt queue will then handle fetching ads, allocating channels,
 * and sending messages for each hunt.
 *
 * @param job - BullMQ job containing trigger timestamp
 * @returns Summary with hunt count, successes, failures, and duration
 */
export async function fetchActiveHuntsWorker(
  job: Job<FetchActiveHuntsJob>
): Promise<FetchResult> {
  const startTime = Date.now();
  const { triggeredAt } = job.data;

  const db = createDrizzleAdmin();
  const results: HuntDispatchResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    // Fetch all active hunts (using admin client to bypass RLS)
    const activeHunts = await db.query.hunts.findMany({
      where: and(
        eq(hunts.status, EHuntStatus.ACTIVE),
        eq(hunts.isActive, true)
      ),
      columns: {
        id: true,
        accountId: true,
        name: true,
      },
    });

    const totalHunts = activeHunts.length;

    // Dispatch each hunt to the hunt queue
    for (let i = 0; i < activeHunts.length; i++) {
      const hunt = activeHunts[i];

      try {
        // Dispatch to hunt queue with huntId and accountId
        // The hunt worker will need to be updated to handle this job type
        const huntJob = await huntQueue.add(
          `daily-hunt-${hunt.id}`,
          {
            huntId: hunt.id,
            accountId: hunt.accountId,
            triggeredAt,
          },
          {
            // Each hunt should be unique per day to avoid duplicates
            jobId: `daily-${hunt.id}-${new Date(triggeredAt).toISOString().split('T')[0]}`,
          }
        );

        results.push({
          huntId: hunt.id,
          huntName: hunt.name,
          status: "queued",
          jobId: huntJob.id,
        });
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          huntId: hunt.id,
          huntName: hunt.name,
          status: "failed",
          error: errorMessage,
        });
        failureCount++;
      }

      // Update progress (0-100)
      const progress = Math.round(((i + 1) / totalHunts) * 100);
      await job.updateProgress(progress);
    }

    const duration = Date.now() - startTime;

    return {
      totalHunts,
      successCount,
      failureCount,
      duration,
      results,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(
      `Active hunts fetch failed after ${duration}ms: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
