/**
 * Daily Hunts Orchestrator Worker
 *
 * Master orchestrator that coordinates the entire daily hunt process.
 * Triggers active hunt fetches, processes each hunt, manages concurrency,
 * and tracks overall progress.
 *
 * Process:
 * 1. Fetch all active hunts from database
 * 2. Process hunts with controlled concurrency (5 parallel)
 * 3. For each hunt, call web app API to process hunt
 * 4. Track overall progress and errors
 * 5. Return summary report
 *
 * This worker acts as the entry point for daily automated hunts,
 * triggered by cron at a configured time (e.g., 8 AM).
 */

import { Job } from "bullmq";
import { createDrizzleAdmin, hunts } from "@auto-prospect/db";
import { EHuntStatus } from "@auto-prospect/shared";
import { eq, and } from "drizzle-orm";

interface DailyOrchestratorJob {
  triggeredAt: string; // ISO timestamp for tracking
  source: "cron" | "manual"; // How this job was triggered
}

interface HuntProcessResult {
  huntId: string;
  huntName: string;
  status: "success" | "failed";
  messagesDispatched?: number;
  error?: string;
}

interface OrchestratorResult {
  totalHunts: number;
  successCount: number;
  failureCount: number;
  duration: number;
  results: HuntProcessResult[];
}

// Web app configuration for API calls
const WEB_APP_URL = process.env.WEB_APP_URL || "http://localhost:3000";
const WEB_APP_SECRET = process.env.WEB_APP_SECRET;

if (!WEB_APP_SECRET) {
  throw new Error("WEB_APP_SECRET environment variable is required");
}

/**
 * Daily Orchestrator Worker Implementation
 *
 * Fetches all active hunts and processes them with controlled concurrency.
 * Each hunt is processed by calling the web app's hunt processing API,
 * which handles ad fetching, allocation, personalization, and worker dispatch.
 *
 * @param job - BullMQ job containing trigger info
 * @returns Summary with hunt count, successes, failures, and duration
 */
export async function dailyOrchestratorWorker(
  job: Job<DailyOrchestratorJob>
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const { triggeredAt, source } = job.data;

  const db = createDrizzleAdmin();
  const results: HuntProcessResult[] = [];

  try {
    // Fetch all active hunts
    const activeHunts = await db.query.hunts.findMany({
      where: and(eq(hunts.status, EHuntStatus.ACTIVE), eq(hunts.isActive, true)),
      columns: {
        id: true,
        accountId: true,
        name: true,
      },
      with: {
        location: true,
        subTypes: true,
        brands: true,
      },
    });

    const totalHunts = activeHunts.length;

    if (totalHunts === 0) {
      return {
        totalHunts: 0,
        successCount: 0,
        failureCount: 0,
        duration: Date.now() - startTime,
        results: [],
      };
    }

    // Process hunts with controlled concurrency (5 parallel)
    const concurrency = 5;
    const queue = [...activeHunts];
    const inFlight: Promise<void>[] = [];
    let processedCount = 0;

    // While there's work left or jobs in flight
    while (queue.length || inFlight.length) {
      // Start new jobs while we're under capacity and have work
      while (inFlight.length < concurrency && queue.length) {
        const hunt = queue.shift()!;

        const huntPromise = processHunt(hunt.id, hunt.accountId, hunt.name)
          .then((result) => {
            results.push(result);
            if (result.status === "success") {
              processedCount++;
            }
          })
          .catch((error) => {
            results.push({
              huntId: hunt.id,
              huntName: hunt.name,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          })
          .finally(() => {
            // Remove this promise from inFlight when done
            const idx = inFlight.indexOf(huntPromise);
            if (idx !== -1) inFlight.splice(idx, 1);

            // Update progress (0-100)
            const progress = Math.round(
              (results.length / totalHunts) * 100
            );
            job.updateProgress(progress);
          });

        inFlight.push(huntPromise);
      }

      // Wait for at least one job to finish before continuing
      if (inFlight.length > 0) {
        await Promise.race(inFlight);
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

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
      `Daily orchestrator failed after ${duration}ms: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Processes a single hunt by calling the web app's hunt processing API
 *
 * @param huntId - Hunt ID to process
 * @param accountId - Account ID for the hunt
 * @param huntName - Hunt name for logging
 * @returns Processing result
 */
async function processHunt(
  huntId: string,
  accountId: string,
  huntName: string
): Promise<HuntProcessResult> {
  try {
    // Call web app API to process this hunt
    // The web app handles: fetch ads, allocate channels, personalize messages,
    // dispatch to worker queues, consume credits, create leads
    const response = await fetch(`${WEB_APP_URL}/api/hunts/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEB_APP_SECRET}`,
      },
      body: JSON.stringify({
        huntId,
        accountId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          `API returned ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();

    return {
      huntId,
      huntName,
      status: "success",
      messagesDispatched: result.messagesDispatched || 0,
    };
  } catch (error) {
    return {
      huntId,
      huntName,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
