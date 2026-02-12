/**
 * WhatsApp Routes
 *
 * Handles all WhatsApp-related messaging through the WhatsApp API (via Baileys).
 *
 * Current capabilities:
 * - Text messages
 *
 */

import { Router } from "express";
import { sendWhatsAppController } from "../controllers/whatsapp.controller";

const router = Router();

/**
 * POST /whatsapp/text
 *
 * Sends a text message via WhatsApp
 *
 * Body:
 * - recipientPhone: string - Phone number in international format (e.g., "+33612345678")
 * - message: string - Text content to send
 * - accountId: string - Account ID for session lookup
 * - metadata?: object - Optional tracking metadata (huntId, adId)
 *
 * Returns:
 * - success: boolean
 * - jobId: string - BullMQ job ID for tracking
 * - error?: string - Error code if validation fails
 *
 * Note: Controller validates account and WhatsApp session exist BEFORE queueing job
 */
router.post("/text", sendWhatsAppController);

export default router;
