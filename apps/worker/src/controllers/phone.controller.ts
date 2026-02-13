/**
 * Phone Channel Controllers
 *
 * Thin passthrough controllers for SMS and voice.
 * Web app does ALL validation - these just queue jobs.
 *
 * Architecture:
 * - User clicks "Send" → Web app validates → Calls THIS CONTROLLER
 * - Controller does minimal request validation
 * - Queues job with all validated data from web app
 */

import { EGeneralErrorCode } from "@auto-prospect/shared";
import { Request, Response } from "express";
import { JOB_TYPES } from "../config";
import { smsQueue, voiceQueue } from "../queues";

/**
 * POST /phone/sms
 *
 * Thin passthrough controller for SMS sending.
 * Web app already validated everything - just queue the job.
 */
export async function sendSmsController(req: Request, res: Response) {
  const { recipientPhone, message, decryptedApiKey, metadata } = req.body;

  // Basic request validation only
  if (!recipientPhone || !message || !decryptedApiKey) {
    return res.status(400).json({
      success: false,
      error: EGeneralErrorCode.VALIDATION_FAILED,
    });
  }

  // Queue job with validated data from web app
  const job = await smsQueue.add(JOB_TYPES.SMS_SEND, {
    recipientPhone,
    message,
    decryptedApiKey,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}

/**
 * POST /phone/ringless-voice
 *
 * Thin passthrough controller for ringless voice sending.
 * Web app already validated everything - just queue the job.
 */
export async function sendVoiceController(req: Request, res: Response) {
  const { recipientPhone, tokenAudio, sender, scheduledDate, apiKey, apiSecret, metadata } =
    req.body;

  // Basic request validation only
  if (!recipientPhone || !tokenAudio || !apiKey || !apiSecret) {
    return res.status(400).json({
      success: false,
      error: EGeneralErrorCode.VALIDATION_FAILED,
    });
  }

  // Queue job with validated data from web app
  const job = await voiceQueue.add(JOB_TYPES.VOICE_SEND, {
    recipientPhone,
    tokenAudio,
    sender,
    scheduledDate,
    apiKey,
    apiSecret,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}
