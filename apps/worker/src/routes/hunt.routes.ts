/**
 * Hunt Routes
 *
 * "Hunt" is the core automation feature of Auto-Prospect:
 * - A robot fetches ads matching user criteria (from LeBonCoin, etc.)
 * - Messages are sent to ad owners via the user's preferred channels
 * - Channels are prioritized based on user configuration
 * - Credits are consumed per channel
 * - Daily pacing limits prevent spam
 *
 * Flow:
 * 1. Cron job triggers daily hunt (calls runDailyHunts in web app)
 * 2. Web app identifies matching ads and allocates them to channels
 * 3. Web app calls this API to execute the hunt
 * 4. Worker processes each contact via the appropriate channel (WhatsApp, SMS, Voice)
 * 5. Results are tracked in the database (leads, contacted ads, credits consumed)
 *
 * This is essentially a "bulk send" operation, but named "hunt" to match
 * the app's domain terminology.
 */

import { Router, Request, Response } from "express";
import { huntQueue } from "../queues";

const router = Router();

/**
 * POST /hunt/execute
 *
 * Executes a hunt by sending messages to multiple prospects via allocated channels
 *
 * This endpoint is called by the web app's runDailyHunts service after:
 * 1. Fetching matching ads
 * 2. Allocating ads to channels based on priority & credits
 * 3. Checking daily pacing limits
 *
 * Body:
 * - huntId: string - The hunt configuration ID
 * - accountId: string - User's account ID (for tracking)
 * - contacts: Array<{
 *     adId: string - The ad being contacted
 *     recipientPhone: string - Ad owner's phone
 *     channel: "whatsapp_text" | "sms" | "ringless_voice" - Allocated channel
 *     message: string - Personalized message content
 *     senderPhone?: string - Required for WhatsApp
 *   }>
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking the entire hunt
 * - contactCount: number - Number of contacts to be processed
 *
 * Example:
 * ```
 * POST /api/hunt/execute
 * {
 *   "huntId": "hunt_123",
 *   "accountId": "acc_456",
 *   "contacts": [
 *     {
 *       "adId": "ad_789",
 *       "recipientPhone": "+33612345678",
 *       "channel": "whatsapp_text",
 *       "message": "Bonjour, j'ai vu votre annonce...",
 *       "senderPhone": "+33601020304"
 *     },
 *     {
 *       "adId": "ad_790",
 *       "recipientPhone": "+33687654321",
 *       "channel": "sms",
 *       "message": "Bonjour, votre annonce m'intéresse..."
 *     }
 *   ]
 * }
 * ```
 *
 * Processing:
 * - The hunt worker dispatches each contact to the appropriate channel queue
 * - Each channel worker processes the message independently
 * - Retries are handled per-contact (not per-hunt)
 * - Failed contacts don't block successful ones
 */
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { huntId, accountId, contacts } = req.body;

    // Validate required fields
    if (!huntId || !accountId || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        error: "Missing required fields: huntId, accountId, contacts (array)"
      });
    }

    if (contacts.length === 0) {
      return res.status(400).json({
        error: "Contacts array cannot be empty"
      });
    }

    // Validate each contact has required fields
    const invalidContacts = contacts.filter(
      (contact) =>
        !contact.adId ||
        !contact.recipientPhone ||
        !contact.channel ||
        !contact.message
    );

    if (invalidContacts.length > 0) {
      return res.status(400).json({
        error: "Invalid contacts: each contact must have adId, recipientPhone, channel, and message",
        invalidCount: invalidContacts.length
      });
    }

    // Add job to hunt queue
    // The hunt worker will dispatch to individual channel queues
    const job = await huntQueue.add("execute-hunt", {
      huntId,
      accountId,
      contacts,
    });

    res.json({
      success: true,
      jobId: job.id,
      contactCount: contacts.length
    });
  } catch (error) {
    console.error("Hunt execute error:", error);
    res.status(500).json({ error: "Failed to queue hunt execution" });
  }
});

/**
 * GET /hunt/status/:jobId
 *
 * Gets the status of a hunt execution
 *
 * Returns:
 * - jobId: string
 * - state: "waiting" | "active" | "completed" | "failed"
 * - progress: number (0-100)
 * - processedCount: number - Contacts processed so far
 * - totalCount: number - Total contacts in hunt
 * - failedCount: number - Contacts that failed
 * - results: Array of individual contact results (when completed)
 *
 * Example:
 * ```
 * GET /api/hunt/status/job_123
 * ```
 */
router.get("/status/:jobId", async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const job = await huntQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Hunt job not found" });
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    // Get results if job is completed
    let results = null;
    if (state === "completed") {
      results = job.returnvalue;
    }

    res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data,
      results,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    });
  } catch (error) {
    console.error("Get hunt status error:", error);
    res.status(500).json({ error: "Failed to get hunt status" });
  }
});

export default router;
