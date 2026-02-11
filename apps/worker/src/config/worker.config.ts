/**
 * Worker Configuration
 * Single source of truth for all worker-related constants
 */

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
 * Retry configuration for different job types
 */
export const RETRY_CONFIG = {
  MESSAGE_SEND: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000, // Start with 2 seconds, doubles each retry
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
