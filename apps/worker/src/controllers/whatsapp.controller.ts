/**
 * WhatsApp Controller
 *
 * Validates user-initiated WhatsApp requests BEFORE queueing jobs.
 * This ensures users get immediate feedback on validation errors.
 *
 * Architecture:
 * - User clicks "Send WhatsApp" → Route → THIS CONTROLLER
 * - Controller validates: phone format, account exists, session exists
 * - If validation fails → return error immediately (400)
 * - If validation passes → queue job with ALL necessary data
 * - Worker receives pre-validated data (including session credentials) → no re-fetching
 */

import { accounts, getDBAdminClient } from "@auto-prospect/db";
import { EGeneralErrorCode, EWhatsAppErrorCode } from "@auto-prospect/shared";
import { StoredAuthState } from "@auto-prospect/whatsapp";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { JOB_TYPES } from "../config";
import { whatsappQueue } from "../queues";

/**
 * POST /whatsapp/text
 *
 * Sends a text message via WhatsApp
 *
 * Validation phase (happens here):
 * - Check required fields (recipientPhone, message, accountId)
 * - Fetch account and verify it exists
 * - Verify WhatsApp session exists (user has connected via QR code)
 * - Parse and validate session credentials
 *
 * Execution phase:
 * - Queue job with ALL validated data (including session credentials)
 * - Worker receives everything it needs, no re-fetching
 */
export async function sendWhatsAppController(req: Request, res: Response) {
  const { recipientPhone, message, accountId, metadata } = req.body;

  // ===== VALIDATION PHASE =====
  // All user-facing validation happens HERE (before queueing)

  if (!recipientPhone || !message) {
    return res.status(400).json({
      success: false,
      error: EGeneralErrorCode.VALIDATION_FAILED,
    });
  }

  // Fetch account and WhatsApp session
  const db = getDBAdminClient();
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { id: true },
    with: {
      whatsappSession: {
        columns: { credentials: true },
      },
    },
  });

  if (!account) {
    return res.status(400).json({
      success: false,
      error: EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
    });
  }

  // Verify WhatsApp session exists
  const session = account.whatsappSession;
  if (!session || !session.credentials) {
    return res.status(400).json({
      success: false,
      error: EWhatsAppErrorCode.SESSION_NOT_FOUND,
    });
  }

  // Parse and validate session credentials
  let credentials: StoredAuthState;
  try {
    credentials = JSON.parse(session.credentials) as StoredAuthState;
  } catch {
    return res.status(400).json({
      success: false,
      error: EWhatsAppErrorCode.SESSION_EXPIRED,
    });
  }

  // ===== EXECUTION PHASE =====
  // Validation passed, queue the job with ALL necessary data
  const job = await whatsappQueue.add(JOB_TYPES.WHATSAPP_SEND_TEXT, {
    recipientPhone,
    message,
    accountId,
    credentials,
    metadata,
  });

  return res.json({ success: true, jobId: job.id });
}
