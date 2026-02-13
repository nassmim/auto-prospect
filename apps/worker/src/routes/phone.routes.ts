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

import { Router } from "express";
import {
  sendSmsController,
  sendVoiceController,
} from "../controllers/phone.controller";

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
 * - accountId: string - Account ID for API key lookup
 * - metadata?: object - Optional tracking metadata (huntId, adId, leadId)
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 * - error?: string - Error code if validation fails
 *
 * Note: Controller validates API key exists BEFORE queueing job
 */
router.post("/sms", sendSmsController);

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
 * - tokenAudio: string - Pre-recorded audio token from Voice Partner
 * - sender?: string - Optional caller ID
 * - scheduledDate?: string - Optional schedule for future delivery
 * - metadata?: object - Optional tracking metadata (huntId, accountId, adId)
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 * - error?: string - Error code if validation fails
 *
 * Note: Controller validates API credentials exist BEFORE queueing job
 */
router.post("/ringless-voice", sendVoiceController);

export default router;
