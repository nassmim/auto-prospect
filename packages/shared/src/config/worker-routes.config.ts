/**
 * Worker API Routes
 *
 * Centralized route definitions for the worker service API.
 * Import these in both the web client and worker server to ensure consistency.
 */

export const WORKER_ROUTES = {
  // WhatsApp routes
  WHATSAPP_TEXT: "/api/whatsapp/text",

  // Phone routes (SMS + Voice)
  PHONE_SMS: "/api/phone/sms",
  PHONE_RINGLESS_VOICE: "/api/phone/ringless-voice",

  // Hunt routes
  HUNT_EXECUTE: "/api/hunt/execute",
  HUNT_STATUS: "/api/hunt/status", // append /:jobId

  // Job monitoring routes
  JOB_STATUS: "/api/jobs", // append /:queue/:jobId
  QUEUE_STATS_ALL: "/api/queues/stats",
  QUEUE_STATS: "/api/queues", // append /:queue/stats
} as const;

export type TWorkerRoutes = typeof WORKER_ROUTES;
