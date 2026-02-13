import { Router } from "express";
import cronRoutes from "./cron.routes";
import phoneRoutes from "./phone.routes";
import webhookRoutes from "./webhook.routes";
import whatsappRoutes from "./whatsapp.routes";

const router = Router();

// Mount route modules
router.use("/whatsapp", whatsappRoutes);
router.use("/phone", phoneRoutes);
router.use("/cron", cronRoutes);
router.use("/webhooks", webhookRoutes);

export default router;
