/**
 * Worker Configuration
 * Single source of truth for all worker-related constants
 */

/**
 * Error Classification for Retry Logic
 *
 * RETRYABLE ERRORS (throw to trigger BullMQ retry):
 * - Network timeouts, connection refused
 * - HTTP 5xx server errors
 * - HTTP 429 rate limits (with backoff)
 * - Temporary service unavailable
 *
 * NON-RETRYABLE ERRORS (return error object, mark job as failed):
 * - HTTP 4xx client errors (except 429)
 * - Invalid credentials (401, 403)
 * - Invalid data/validation errors (400)
 * - Resource not found (404)
 * - Business logic errors (insufficient credits, invalid phone)
 */
export const RETRYABLE_HTTP_CODES = [408, 429, 500, 502, 503, 504] as const;
export const NON_RETRYABLE_HTTP_CODES = [400, 401, 403, 404, 422] as const;

export function isRetryableHttpCode(code: number): boolean {
  return RETRYABLE_HTTP_CODES.includes(
    code as (typeof RETRYABLE_HTTP_CODES)[number],
  );
}

/**
 * Job type names used when adding jobs to queues
 * These are the first argument to queue.add()
 */
export const JOB_TYPES = {
  WHATSAPP_SEND_TEXT: "send-text",
  SMS_SEND: "send-sms",
  VOICE_SEND: "send-ringless-voice",
} as const;

/**
 * Job ID template generators
 * These functions create consistent job IDs across the worker system
 */
export const jobIds = {
  hunt: {
    whatsapp: (huntId: string, adId: string) => `hunt-${huntId}-whatsapp-${adId}`,
    sms: (huntId: string, adId: string) => `hunt-${huntId}-sms-${adId}`,
    voice: (huntId: string, adId: string) => `hunt-${huntId}-voice-${adId}`,
  },
} as const;

/**
 * Retry configuration for BullMQ jobs
 *
 * WHEN TO RETRY:
 * - Network failures (ETIMEDOUT, ECONNREFUSED)
 * - HTTP 5xx server errors
 * - HTTP 429 rate limits (backoff will help)
 * - Temporary service unavailable
 *
 * WHEN NOT TO RETRY:
 * - HTTP 400 Bad Request (invalid data)
 * - HTTP 401/403 Unauthorized (invalid credentials)
 * - HTTP 404 Not Found (resource doesn't exist)
 * - Business logic errors (insufficient credits, invalid phone format)
 *
 * For MESSAGE_SEND:
 * - 3 attempts with exponential backoff (2s, 4s, 8s)
 * - Total max wait: ~14 seconds before final failure
 *
 * For SCRAPING:
 * - 2 attempts with fixed 5s delay
 * - Scraping failures are often temporary (site load)
 */
export const RETRY_CONFIG = {
  MESSAGE_SEND: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
  },
  SCRAPING: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 5000,
    },
  },
} as const;

/**
 * API route paths for worker-to-API communication
 */
export const API_ROUTES = {
  whatsapp: {
    text: '/api/whatsapp/text',
    audio: '/api/whatsapp/audio',
  },
  phone: {
    sms: '/api/phone/sms',
    ringlessVoice: '/api/phone/ringless-voice',
  },
  cron: {
    dailyHunts: '/api/cron/daily-hunts',
  },
} as const;

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  CONNECTION: 30000, // 30 seconds
  QR_CODE: 120000, // 2 minutes
  MESSAGE_ACK: 10000, // 10 seconds
} as const;
