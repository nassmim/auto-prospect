/**
 * WhatsApp Controller
 *
 * Thin passthrough controller for WhatsApp sending.
 * Web app already validated everything - just queue the job.
 */

import { EGeneralErrorCode } from "@auto-prospect/shared";
import { Request, Response } from "express";
import { JOB_TYPES } from "../config";
import { whatsappQueue } from "../queues";

/**
 * POST /whatsapp/text
 *
 * Thin passthrough controller for WhatsApp text sending.
 * Web app already validated everything - just queue the job.
 */
export async function sendWhatsAppController(req: Request, res: Response) {
  const { recipientPhone, message, accountId, credentials, metadata } = req.body;

  // Basic request validation only
  if (!recipientPhone || !message || !accountId || !credentials) {
    return res.status(400).json({
      success: false,
      error: EGeneralErrorCode.VALIDATION_FAILED,
    });
  }

  // Queue job with validated data from web app
  const job = await whatsappQueue.add(JOB_TYPES.WHATSAPP_SEND_TEXT, {
    recipientPhone,
    message,
    accountId,
    credentials,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}
