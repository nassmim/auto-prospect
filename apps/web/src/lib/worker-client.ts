/**
 * Worker API Client
 *
 * HTTP client for communicating with the worker service.
 *
 * The worker handles:
 * - WhatsApp messaging (via Baileys)
 * - SMS messaging
 * - Ringless voice messages
 * - Hunt execution (automated prospect outreach)
 *
 * Configuration:
 * - WORKER_API_URL: Worker service URL (e.g., "https://worker.railway.app" or "http://localhost:3001")
 * - WORKER_API_SECRET: Bearer token for authentication
 *
 * Usage:
 * - Import functions from this file in server actions or server components
 * - Never use in client components (exposes API secret)
 *
 * Error Handling:
 * - All functions return { success: false, error: TErrorCode } on failure
 * - Use getErrorMessage(error) from error-messages.utils.ts to display user-friendly messages
 * - User-actionable errors (MISSING_REQUIRED_FIELDS, etc.) show specific messages
 * - System errors (queue failures, etc.) show generic "Réessaie" message
 */

import {
  EGeneralErrorCode,
  TErrorCode,
  WORKER_ROUTES,
} from "@auto-prospect/shared";

const WORKER_URL = process.env.WORKER_API_URL;
const WORKER_SECRET = process.env.WORKER_API_SECRET;

type TWorkerSuccess<T> = { success: true } & T;
type TWorkerError = { success: false; error: TErrorCode };
type TWorkerResult<T> = TWorkerSuccess<T> | TWorkerError;

/**
 * Internal helper for POST requests to worker API
 * Returns structured error codes instead of throwing
 */
const workerPost = async <T>(
  path: string,
  body: unknown,
): Promise<TWorkerResult<T>> => {
  if (!WORKER_URL || !WORKER_SECRET) {
    return {
      success: false,
      error: EGeneralErrorCode.UNKNOWN_ERROR,
    };
  }

  try {
    const response = await fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Worker returns { error: TErrorCode } on failure
      return {
        success: false,
        error: data.error || EGeneralErrorCode.UNKNOWN_ERROR,
      };
    }

    // Worker returns { success: true, ...data } on success
    return data;
  } catch {
    // Network errors, JSON parse errors, etc.
    return {
      success: false,
      error: EGeneralErrorCode.UNKNOWN_ERROR,
    };
  }
};

/**
 * Internal helper for GET requests to worker API
 * Returns structured error codes instead of throwing
 */
const workerGet = async <T>(path: string): Promise<TWorkerResult<T>> => {
  if (!WORKER_URL || !WORKER_SECRET) {
    return {
      success: false,
      error: EGeneralErrorCode.UNKNOWN_ERROR,
    };
  }

  try {
    const response = await fetch(`${WORKER_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Worker returns { error: TErrorCode } on failure
      return {
        success: false,
        error: data.error || EGeneralErrorCode.UNKNOWN_ERROR,
      };
    }

    // Worker returns { success: true, ...data } on success
    return data;
  } catch {
    // Network errors, JSON parse errors, etc.
    return {
      success: false,
      error: EGeneralErrorCode.UNKNOWN_ERROR,
    };
  }
};

// ============================================================================
// WHATSAPP API
// ============================================================================

/**
 * Sends a WhatsApp text message
 *
 * @param data.recipientPhone - Phone in international format (e.g., "+33612345678")
 * @param data.senderPhone - Your WhatsApp Business account phone
 * @param data.message - Text content to send
 * @returns { success: true, jobId: string } | { success: false, error: TErrorCode }
 *
 * @example
 * const result = await sendWhatsAppText({ ... });
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Job ID:', result.jobId);
 */
export const sendWhatsAppText = (data: {
  recipientPhone: string;
  senderPhone: string;
  message: string;
}): Promise<TWorkerResult<{ jobId: string }>> =>
  workerPost(WORKER_ROUTES.WHATSAPP_TEXT, data);

// ============================================================================
// PHONE CHANNEL API (SMS + Voice)
// ============================================================================

/**
 * Sends an SMS text message
 *
 * @param data.recipientPhone - Phone in international format
 * @param data.message - Text content (max 160 chars for single SMS)
 * @returns { success: true, jobId: string } | { success: false, error: TErrorCode }
 *
 * @example
 * const result = await sendSms({ ... });
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Job ID:', result.jobId);
 */
export const sendSms = (data: {
  recipientPhone: string;
  message: string;
}): Promise<TWorkerResult<{ jobId: string }>> =>
  workerPost(WORKER_ROUTES.PHONE_SMS, data);

/**
 * Sends a ringless voice message (delivered to voicemail without ringing)
 *
 * @param data.recipientPhone - Phone in international format
 * @param data.message - Text to be converted to speech (TTS)
 * @param data.audioUrl - Optional: URL to pre-recorded audio file (alternative to TTS)
 * @returns { success: true, jobId: string } | { success: false, error: TErrorCode }
 *
 * @example
 * const result = await sendRinglessVoice({ ... });
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Job ID:', result.jobId);
 */
export const sendRinglessVoice = (data: {
  recipientPhone: string;
  message?: string;
  audioUrl?: string;
}): Promise<TWorkerResult<{ jobId: string }>> =>
  workerPost(WORKER_ROUTES.PHONE_RINGLESS_VOICE, data);

// ============================================================================
// HUNT API (Automated Prospect Outreach)
// ============================================================================

/**
 * Executes a hunt by sending messages to multiple prospects
 *
 * This is the main entry point for automated prospect hunting.
 * Called by runDailyHunts service after allocating ads to channels.
 *
 * @param data.huntId - Hunt configuration ID
 * @param data.accountId - User's account ID
 * @param data.contacts - Array of contacts to reach out to
 * @returns { success: true, jobId: string, contactCount: number } | { success: false, error: TErrorCode }
 *
 * @example
 * const result = await executeHunt({
 *   huntId: "hunt_123",
 *   accountId: "acc_456",
 *   contacts: [
 *     {
 *       adId: "ad_789",
 *       recipientPhone: "+33612345678",
 *       channel: "whatsapp_text",
 *       message: "Bonjour...",
 *       senderPhone: "+33601020304"
 *     }
 *   ]
 * });
 *
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 *
 * console.log(`Hunt started: ${result.jobId}, ${result.contactCount} contacts`);
 */
export const executeHunt = (data: {
  huntId: string;
  accountId: string;
  contacts: Array<{
    adId: string;
    recipientPhone: string;
    channel: "whatsapp_text" | "sms" | "ringless_voice";
    message: string;
    senderPhone?: string; // Required for WhatsApp
    audioUrl?: string; // Optional for ringless voice
  }>;
}): Promise<TWorkerResult<{ jobId: string; contactCount: number }>> =>
  workerPost(WORKER_ROUTES.HUNT_EXECUTE, data);

/**
 * Gets the status of a hunt execution
 *
 * @param jobId - The BullMQ job ID returned by executeHunt
 * @returns Promise with job status, progress, and results
 *
 * @example
 * const result = await getHuntStatus('job-123');
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Status:', result.state, 'Progress:', result.progress);
 */
export const getHuntStatus = async (
  jobId: string,
): Promise<
  TWorkerResult<{
    state: string;
    progress: number;
    data: unknown;
    error?: string;
  }>
> => {
  return workerGet(`${WORKER_ROUTES.HUNT_STATUS}/${jobId}`);
};

// ============================================================================
// JOB MONITORING API
// ============================================================================

/**
 * Gets the status of any job in any queue
 *
 * @param queue - Queue name ("whatsapp", "sms", "voice", "hunt")
 * @param jobId - Job ID
 * @returns Promise with job details (state, progress, data, errors)
 *
 * @example
 * const result = await getJobStatus('whatsapp', 'job-123');
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Job state:', result.state);
 */
export const getJobStatus = async (
  queue: string,
  jobId: string,
): Promise<
  TWorkerResult<{
    state: string;
    progress: number;
    data: unknown;
    error?: string;
  }>
> => {
  return workerGet(`${WORKER_ROUTES.JOB_STATUS}/${queue}/${jobId}`);
};

/**
 * Gets statistics for all queues
 *
 * Useful for dashboard monitoring.
 *
 * @returns Promise with array of queue stats (waiting, active, completed, failed counts)
 *
 * @example
 * const result = await getQueuesStats();
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Queues:', result.stats);
 */
export const getQueuesStats = async (): Promise<
  TWorkerResult<{
    stats: Array<{
      queue: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    }>;
  }>
> => {
  return workerGet(WORKER_ROUTES.QUEUE_STATS_ALL);
};

/**
 * Gets statistics for a specific queue
 *
 * @param queue - Queue name ("whatsapp", "sms", "voice", "hunt")
 * @returns Promise with queue stats
 *
 * @example
 * const result = await getQueueStats('whatsapp');
 * if (!result.success) {
 *   toast.error(getErrorMessage(result.error));
 *   return;
 * }
 * console.log('Queue stats:', result.waiting, result.active);
 */
export const getQueueStats = async (
  queue: string,
): Promise<
  TWorkerResult<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>
> => {
  return workerGet(`${WORKER_ROUTES.QUEUE_STATS}/${queue}/stats`);
};
