/**
 * BullMQ Worker Error Handling System
 *
 * ## Complete Error Handling Flow
 *
 * ### 1. How BullMQ Decides to Retry
 *
 * BullMQ checks error types:
 * - **Worker throws UnrecoverableError** → Never retry (permanent failure)
 * - **Worker throws any other error** → Retry (if attempts < max)
 * - **Worker returns** → Success
 *
 * ### 2. Retry Configuration (Set in Worker Constructor)
 *
 * ```typescript
 * new Worker(QUEUE_NAME, workerFn, {
 *   connection,
 *   attempts: 3,              // Max retry attempts
 *   backoff: {
 *     type: 'exponential',    // Delay: 2s, 4s, 8s...
 *     delay: 2000             // Base delay in ms
 *   }
 * })
 * ```
 *
 * ### 3. Our Error Handling Pattern
 *
 * Use BullMQ's `UnrecoverableError` for permanent failures:
 *
 * ```typescript
 * import { UnrecoverableError } from 'bullmq';
 *
 * export async function smsWorker(job: Job<SmsJob>) {
 *   // Validation: Non-retryable errors
 *   if (!apiKey) {
 *     throw new UnrecoverableError('API key missing'); // ← Prevents retry
 *   }
 *
 *   try {
 *     // Execution: May throw retryable errors (network, rate limit, etc.)
 *     await sendSms({ to, message, apiKey });
 *     return { success: true };
 *   } catch (error) {
 *     // Classify error
 *     if (error.response?.status === 401) {
 *       throw new UnrecoverableError('Invalid API key'); // ← Prevents retry
 *     }
 *     throw error; // BullMQ will retry
 *   }
 * }
 * ```
 *
 * ### 4. What Actually Happens
 *
 * **Non-retryable error (API key missing):**
 * 1. Worker throws `UnrecoverableError`
 * 2. BullMQ sees UnrecoverableError → Marks job as failed (no retry)
 *
 * **Retryable error (network timeout):**
 * 1. Worker throws standard Error
 * 2. BullMQ retries: wait 2s → retry → wait 4s → retry → wait 8s → retry
 * 3. After 3 attempts → Marks job as failed
 *
 * ### 5. Legacy Helper Functions
 *
 * These are kept for backwards compatibility but should not be used in new code.
 * Use BullMQ's UnrecoverableError directly instead.
 *
 * - `isNonRetryable(error)` - Check if error is permanent failure (legacy)
 * - `NonRetryableError` class - Documents permanent failures (legacy)
 * - `RetryableError` class - Documents temporary failures (legacy)
 * - `NON_RETRYABLE_ERROR_CODES` - List of error codes that should not retry (legacy)
 */

import {
  EAccountErrorCode,
  ELeadErrorCode,
  ESmsErrorCode,
  EVoiceErrorCode,
  EWhatsAppErrorCode,
} from "@auto-prospect/shared";

/**
 * Non-retryable error codes that should immediately fail the job
 * These indicate permanent failures that won't resolve with retries
 */
export const NON_RETRYABLE_ERROR_CODES = [
  // SMS - Configuration/credential issues
  ESmsErrorCode.API_KEY_REQUIRED,
  ESmsErrorCode.API_KEY_INVALID,
  ESmsErrorCode.ENCRYPTION_KEY_MISSING,
  ESmsErrorCode.PHONE_NUMBER_INVALID,

  // WhatsApp - Session/account issues
  EWhatsAppErrorCode.SESSION_NOT_FOUND,
  EWhatsAppErrorCode.SESSION_EXPIRED,

  EAccountErrorCode.ACCOUNT_NOT_FOUND,
  ELeadErrorCode.RECIPIENT_PHONE_INVALID,

  // Voice - Configuration issues
  EVoiceErrorCode.API_KEY_MISSING,
  EVoiceErrorCode.API_KEY_INVALID,
  EVoiceErrorCode.AUDIO_TOKEN_REQUIRED,
  EVoiceErrorCode.PHONE_NUMBER_INVALID,
] as const;

/**
 * Custom error class for retryable errors
 * Throwing this error will trigger BullMQ's retry mechanism
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

/**
 * Custom error class for non-retryable errors
 * These should be caught and returned as failed job results
 */
export class NonRetryableError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "NonRetryableError";
  }
}

/**
 * Determines if an error code should trigger retries
 */
export function isRetryableErrorCode(code: string): boolean {
  return !NON_RETRYABLE_ERROR_CODES.includes(
    code as (typeof NON_RETRYABLE_ERROR_CODES)[number],
  );
}

/**
 * Checks if an error is non-retryable and should fail the job immediately
 *
 * Use this to determine whether to:
 * - Call job.discard() and throw (non-retryable)
 * - Just throw (retryable - BullMQ will retry)
 *
 * @param error - The error to check
 * @returns true if error is non-retryable (permanent failure)
 *
 * @example
 * // In worker catch block:
 * catch (error) {
 *   if (isNonRetryable(error)) {
 *     await job.discard(); // Prevent retry
 *     throw error;
 *   }
 *   // For retryable errors, just throw
 *   throw error;
 * }
 */
export function isNonRetryable(error: unknown): boolean {
  if (error instanceof NonRetryableError) {
    return true;
  }

  if (error instanceof Error) {
    // Check if error message contains known non-retryable codes
    const errorCode = extractErrorCode(error.message);
    return errorCode ? !isRetryableErrorCode(errorCode) : false;
  }

  return false;
}

function extractErrorCode(message: string): string | null {
  // Try to extract error code from message (e.g., "API_KEY_INVALID")
  const match = message.match(/\b[A-Z_]{3,}\b/);
  return match ? match[0] : null;
}
