/**
 * Worker API Client Service
 *
 * Handles communication with the worker service for background job processing.
 * This service dispatches messages to the worker's queues (WhatsApp, SMS, Voice).
 */

import { EWorkerErrorCode } from "@auto-prospect/shared";

const WORKER_API_URL = process.env.WORKER_API_URL;
const WORKER_API_SECRET = process.env.WORKER_API_SECRET;

if (!WORKER_API_URL) {
  throw new Error("WORKER_API_URL environment variable is required");
}

if (!WORKER_API_SECRET) {
  throw new Error("WORKER_API_SECRET environment variable is required");
}

/**
 * Contact to be sent via a specific channel
 * Matches the HuntContact interface in hunt.ts worker
 */
export interface WorkerHuntContact {
  adId: string;
  recipientPhone: string;
  channel: "whatsapp_text" | "sms" | "ringless_voice";
  message: string;
  senderPhone?: string; // Required for WhatsApp
  audioUrl?: string; // Optional for ringless voice (instead of TTS)
}

/**
 * Request body for hunt execution
 */
interface DispatchHuntRequest {
  huntId: string;
  accountId: string;
  contacts: WorkerHuntContact[];
}

/**
 * Response from hunt execution
 */
interface DispatchHuntResponse {
  success: boolean;
  jobId: string;
  contactCount: number;
}

/**
 * Dispatches hunt messages to the worker for processing
 *
 * @param huntId - Hunt configuration ID
 * @param accountId - User's account ID
 * @param contacts - Array of contacts with channel allocations
 * @returns Job ID and contact count
 */
export async function dispatchHuntMessages(
  huntId: string,
  accountId: string,
  contacts: WorkerHuntContact[]
): Promise<DispatchHuntResponse> {
  try {
    const response = await fetch(`${WORKER_API_URL}/api/hunt/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WORKER_API_SECRET}`,
      },
      body: JSON.stringify({
        huntId,
        accountId,
        contacts,
      } satisfies DispatchHuntRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          `Worker API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as DispatchHuntResponse;
    return data;
  } catch (error) {
    throw new Error(
      `Failed to dispatch hunt messages: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Gets the status of a hunt job from the worker
 *
 * @param jobId - BullMQ job ID
 * @returns Job status and results
 */
export async function getHuntJobStatus(jobId: string) {
  try {
    const response = await fetch(
      `${WORKER_API_URL}/api/hunt/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${WORKER_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ||
          `Worker API returned ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to get hunt job status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
