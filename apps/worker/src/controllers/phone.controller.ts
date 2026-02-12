/**
 * Phone Channel Controllers
 *
 * Validates user-initiated SMS and voice requests BEFORE queueing jobs.
 * This ensures users get immediate feedback on validation errors.
 *
 * Architecture:
 * - User clicks "Send" → Route → THIS CONTROLLER
 * - Controller validates: phone format, API keys, account settings
 * - If validation fails → return error immediately (400)
 * - If validation passes → queue job with ALL necessary data
 */

import { accounts, getDBAdminClient } from "@auto-prospect/db";
import {
  decryptCredentials,
  EGeneralErrorCode,
  ESmsErrorCode,
  EVoiceErrorCode,
} from "@auto-prospect/shared";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { JOB_TYPES } from "../config";
import { smsQueue, voiceQueue } from "../queues";

/**
 * POST /phone/sms
 *
 * Sends an SMS text message via cellular network
 *
 * Validation phase (happens here):
 * - Check required fields (recipientPhone, message, accountId)
 * - Fetch account and verify SMS API key exists
 * - Verify encryption key is configured
 * - Decrypt API key to ensure it's valid
 *
 * Execution phase:
 * - Queue job with ALL validated data (including decrypted API key)
 */
export async function sendSmsController(req: Request, res: Response) {
  const { recipientPhone, message, accountId, metadata } = req.body;

  // ===== VALIDATION PHASE =====
  // All user-facing validation happens HERE (before queueing)
  if (!recipientPhone || !message) {
    return res.status(400).json({
      success: false,
      error: EGeneralErrorCode.VALIDATION_FAILED,
    });
  }

  // Fetch account to validate SMS API key exists
  const db = getDBAdminClient();
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { id: true, smsApiKey: true },
  });

  if (!account) {
    return res.status(400).json({
      success: false,
      error: ESmsErrorCode.ACCOUNT_NOT_FOUND,
    });
  }

  if (!account.smsApiKey) {
    return res.status(400).json({
      success: false,
      error: ESmsErrorCode.API_KEY_REQUIRED,
    });
  }

  // Verify encryption key is configured
  const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error();
  }

  // Decrypt API key to validate it's properly encrypted
  let decryptedApiKey = "";
  try {
    decryptedApiKey = decryptCredentials(account.smsApiKey, encryptionKey);
  } catch {
    // Decryption failed - bad encryption or corrupted data
    return res.status(400).json({
      success: false,
      error: ESmsErrorCode.API_KEY_INVALID,
    });
  }

  // ===== EXECUTION PHASE =====
  // Validation passed, queue the job with ALL necessary data
  const job = await smsQueue.add(JOB_TYPES.SMS_SEND, {
    recipientPhone,
    message,
    accountId,
    decryptedApiKey,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}

/**
 * POST /phone/ringless-voice
 *
 * Sends a ringless voice message (delivered directly to voicemail without ringing)
 *
 * Validation phase (happens here):
 * - Check required fields (recipientPhone, tokenAudio)
 * - Validate Voice Partner API credentials are configured
 *
 * Execution phase:
 * - Queue job with validated data
 * - Worker receives everything it needs
 */
export async function sendVoiceController(req: Request, res: Response) {
  const { recipientPhone, tokenAudio, sender, scheduledDate, metadata } =
    req.body;

  // ===== VALIDATION PHASE =====

  if (!recipientPhone) {
    return res.status(400).json({
      success: false,
      error: EVoiceErrorCode.PHONE_NUMBER_REQUIRED,
    });
  }

  if (!tokenAudio) {
    return res.status(400).json({
      success: false,
      error: EVoiceErrorCode.AUDIO_TOKEN_REQUIRED,
    });
  }

  // Verify Voice Partner API credentials are configured
  const apiKey = process.env.VOICE_PARTNER_API_KEY;
  const apiSecret = process.env.VOICE_PARTNER_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error();
  }

  // ===== EXECUTION PHASE =====
  // Validation passed, queue the job
  const job = await voiceQueue.add(JOB_TYPES.VOICE_SEND, {
    recipientPhone,
    tokenAudio,
    sender,
    scheduledDate,
    apiKey, // Pass API credentials to avoid env access in worker
    apiSecret,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}
