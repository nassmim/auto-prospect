/**
 * WhatsApp Routes
 *
 * Handles all WhatsApp-related messaging through the WhatsApp Business API (via Baileys).
 *
 * Current capabilities:
 * - Text messages
 *
 * Future capabilities (to be implemented):
 * - Audio messages
 * - Video messages
 * - Document sharing
 * - Media messages (images, etc.)
 */

import { Router, Request, Response } from "express";
import { whatsappQueue } from "../queues";
import { JOB_TYPES } from "../config";
import { EWorkerErrorCode } from "@auto-prospect/shared";

const router = Router();

/**
 * POST /whatsapp/text
 *
 * Sends a text message via WhatsApp
 *
 * Body:
 * - recipientPhone: string - Phone number in international format (e.g., "+33612345678")
 * - senderPhone: string - Your WhatsApp Business account phone number
 * - message: string - Text content to send
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 *
 * Example:
 * ```
 * POST /api/whatsapp/text
 * {
 *   "recipientPhone": "+33612345678",
 *   "senderPhone": "+33601020304",
 *   "message": "Bonjour, j'ai vu votre annonce..."
 * }
 * ```
 */
router.post("/text", async (req: Request, res: Response) => {
  try {
    const { recipientPhone, senderPhone, message } = req.body;

    // Validate required fields
    if (!recipientPhone || !senderPhone || !message) {
      return res.status(400).json({
        error: EWorkerErrorCode.MISSING_REQUIRED_FIELDS,
        message: "Missing required fields: recipientPhone, senderPhone, message"
      });
    }

    // Add job to WhatsApp queue
    const job = await whatsappQueue.add(JOB_TYPES.WHATSAPP_SEND_TEXT, {
      recipientPhone,
      senderPhone,
      message,
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    res.status(500).json({
      error: EWorkerErrorCode.WHATSAPP_QUEUE_FAILED,
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /whatsapp/audio (PLANNED - Not yet implemented)
 *
 * Will send an audio message via WhatsApp
 *
 * Body (planned):
 * - recipientPhone: string
 * - senderPhone: string
 * - audioUrl: string - URL to the audio file
 */
router.post("/audio", async (_req: Request, res: Response) => {
  res.status(501).json({
    error: "Audio messages not yet implemented",
    message: "This feature is planned for future release"
  });
});

/**
 * POST /whatsapp/video (PLANNED - Not yet implemented)
 *
 * Will send a video message via WhatsApp
 *
 * Body (planned):
 * - recipientPhone: string
 * - senderPhone: string
 * - videoUrl: string - URL to the video file
 */
router.post("/video", async (_req: Request, res: Response) => {
  res.status(501).json({
    error: "Video messages not yet implemented",
    message: "This feature is planned for future release"
  });
});

export default router;
