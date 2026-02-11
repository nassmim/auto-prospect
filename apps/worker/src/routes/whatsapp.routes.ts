/**
 * WhatsApp Routes
 *
 * Handles all WhatsApp-related messaging through the WhatsApp API (via Baileys).
 *
 * Current capabilities:
 * - Text messages
 *
 */

import { EWorkerErrorCode } from "@auto-prospect/shared";
import { Request, Response, Router } from "express";
import { JOB_TYPES } from "../config";
import { whatsappQueue } from "../queues";

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
 */
router.post("/text", async (req: Request, res: Response) => {
  try {
    const { recipientPhone, senderPhone, message } = req.body;

    // Validate required fields
    if (!recipientPhone || !senderPhone || !message) {
      return res.status(400).json({
        error: EWorkerErrorCode.MISSING_REQUIRED_FIELDS,
      });
    }

    // Add job to WhatsApp queue
    const job = await whatsappQueue.add(JOB_TYPES.WHATSAPP_SEND_TEXT, {
      recipientPhone,
      senderPhone,
      message,
    });

    res.json({ success: true, jobId: job.id });
  } catch {
    res.status(500).json({
      error: EWorkerErrorCode.WHATSAPP_QUEUE_FAILED,
    });
  }
});

export default router;
