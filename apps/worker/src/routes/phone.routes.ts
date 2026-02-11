/**
 * Phone Channel Routes
 *
 * Handles phone-based communication channels:
 * - SMS: Text messages via cellular network
 * - Ringless Voice: Voice messages delivered directly to voicemail without ringing
 *
 * These channels are grouped together as they both use phone numbers as the
 * primary contact method
 */

import { EWorkerErrorCode } from "@auto-prospect/shared";
import { Request, Response, Router } from "express";
import { JOB_TYPES } from "../config";
import { smsQueue, voiceQueue } from "../queues";

const router = Router();

// ============================================================================
// SMS ROUTES
// ============================================================================

/**
 * POST /phone/sms
 *
 * Sends an SMS text message via cellular network
 *
 * Body:
 * - recipientPhone: string - Phone number in international format (e.g., "+33612345678")
 * - message: string - Text content (max 160 characters for single SMS, longer messages are split)
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 *
 * Note: SMS provider (Twilio, Vonage, etc.) must be configured in worker environment
 */
router.post("/sms", async (req: Request, res: Response) => {
  try {
    const { recipientPhone, message } = req.body;

    // Validate required fields
    if (!recipientPhone || !message) {
      return res.status(400).json({
        error: EWorkerErrorCode.MISSING_REQUIRED_FIELDS,
        message: "Missing required fields: recipientPhone, message",
      });
    }

    // Add job to SMS queue
    const job = await smsQueue.add(JOB_TYPES.SMS_SEND, {
      recipientPhone,
      message,
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    res.status(500).json({
      error: EWorkerErrorCode.SMS_QUEUE_FAILED,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// RINGLESS VOICE ROUTES
// ============================================================================

/**
 * POST /phone/ringless-voice
 *
 * Sends a ringless voice message (delivered directly to voicemail without ringing)
 *
 * Body:
 * - recipientPhone: string - Phone number in international format
 * - audioUrl: string - URL to pre-recorded audio file
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 *
 * Note: Ringless voice provider must be configured in worker environment
 */
router.post("/ringless-voice", async (req: Request, res: Response) => {
  try {
    const { recipientPhone, message, audioUrl } = req.body;

    // Validate required fields
    if (!recipientPhone || (!message && !audioUrl)) {
      return res.status(400).json({
        error: EWorkerErrorCode.MISSING_REQUIRED_FIELDS,
        message:
          "Missing required fields: recipientPhone and either message or audioUrl",
      });
    }

    // Add job to voice queue
    const job = await voiceQueue.add(JOB_TYPES.VOICE_SEND, {
      recipientPhone,
      message,
      audioUrl,
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    res.status(500).json({
      error: EWorkerErrorCode.VOICE_QUEUE_FAILED,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
