/**
 * API Routes Index
 *
 * Main router that combines all route modules.
 *
 * Route organization:
 * - /whatsapp/* - WhatsApp messaging (text, audio, video - future)
 * - /phone/* - Phone channel (SMS, ringless voice)
 * - /hunt/* - Automated prospect hunting (bulk operations)
 * - /jobs/* - Job status tracking
 * - /queues/* - Queue statistics and monitoring
 *
 * All routes require Bearer token authentication (handled in src/index.ts)
 */

import { Router } from "express";
import whatsappRoutes from "./whatsapp.routes";
import phoneRoutes from "./phone.routes";
import huntRoutes from "./hunt.routes";
import jobsRoutes from "./jobs.routes";

const router = Router();

// Mount route modules
router.use("/whatsapp", whatsappRoutes);
router.use("/phone", phoneRoutes);
router.use("/hunt", huntRoutes);
router.use("/jobs", jobsRoutes);
router.use("/queues", jobsRoutes); // Queue stats are in jobs.routes

export default router;
