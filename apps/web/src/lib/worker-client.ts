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
 */

const WORKER_URL = process.env.WORKER_API_URL;
const WORKER_SECRET = process.env.WORKER_API_SECRET;

/**
 * Internal helper for POST requests to worker API
 */
const workerFetch = async (path: string, body: unknown) => {
  if (!WORKER_URL || !WORKER_SECRET) {
    throw new Error(
      "Worker API not configured. Set WORKER_API_URL and WORKER_API_SECRET environment variables."
    );
  }

  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Worker API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Internal helper for GET requests to worker API
 */
const workerGet = async (path: string) => {
  if (!WORKER_URL || !WORKER_SECRET) {
    throw new Error(
      "Worker API not configured. Set WORKER_API_URL and WORKER_API_SECRET environment variables."
    );
  }

  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Worker API error (${response.status}): ${errorText}`);
  }

  return response.json();
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
 * @returns Promise with { success: boolean, jobId: string }
 */
export const sendWhatsAppText = (data: {
  recipientPhone: string;
  senderPhone: string;
  message: string;
}) => workerFetch("/api/whatsapp/text", data);

// ============================================================================
// PHONE CHANNEL API (SMS + Voice)
// ============================================================================

/**
 * Sends an SMS text message
 *
 * @param data.recipientPhone - Phone in international format
 * @param data.message - Text content (max 160 chars for single SMS)
 * @returns Promise with { success: boolean, jobId: string }
 */
export const sendSms = (data: { recipientPhone: string; message: string }) =>
  workerFetch("/api/phone/sms", data);

/**
 * Sends a ringless voice message (delivered to voicemail without ringing)
 *
 * @param data.recipientPhone - Phone in international format
 * @param data.message - Text to be converted to speech (TTS)
 * @param data.audioUrl - Optional: URL to pre-recorded audio file (alternative to TTS)
 * @returns Promise with { success: boolean, jobId: string }
 */
export const sendRinglessVoice = (data: {
  recipientPhone: string;
  message?: string;
  audioUrl?: string;
}) => workerFetch("/api/phone/ringless-voice", data);

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
 * @returns Promise with { success: boolean, jobId: string, contactCount: number }
 *
 * Example:
 * ```
 * await executeHunt({
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
 * ```
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
}) => workerFetch("/api/hunt/execute", data);

/**
 * Gets the status of a hunt execution
 *
 * @param jobId - The BullMQ job ID returned by executeHunt
 * @returns Promise with job status, progress, and results
 */
export const getHuntStatus = async (jobId: string) => {
  return workerGet(`/api/hunt/status/${jobId}`);
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
 */
export const getJobStatus = async (queue: string, jobId: string) => {
  return workerGet(`/api/jobs/${queue}/${jobId}`);
};

/**
 * Gets statistics for all queues
 *
 * Useful for dashboard monitoring.
 *
 * @returns Promise with array of queue stats (waiting, active, completed, failed counts)
 */
export const getQueuesStats = async () => {
  return workerGet(`/api/queues/stats`);
};

/**
 * Gets statistics for a specific queue
 *
 * @param queue - Queue name ("whatsapp", "sms", "voice", "hunt")
 * @returns Promise with queue stats
 */
export const getQueueStats = async (queue: string) => {
  return workerGet(`/api/queues/${queue}/stats`);
};
