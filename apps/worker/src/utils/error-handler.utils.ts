/**
 * BullMQ Worker Error Handling System
 *
 * This module provides error classification for BullMQ workers to distinguish between:
 * - **Retryable errors**: Temporary failures (network issues, rate limits, server errors)
 * - **Non-retryable errors**: Permanent failures (invalid credentials, bad data, missing config)
 *
 * ## How It Works (Complete Flow):
 *
 * 1. **Worker catches error** during job execution
 * 2. **Worker throws custom error**:
 *    - `NonRetryableError` → BullMQ fails job immediately (no retry)
 *    - `RetryableError` → BullMQ retries job per RETRY_CONFIG
 *    - Generic `Error` → BullMQ treats as retryable (default behavior)
 *
 * 3. **BullMQ behavior**:
 *    - On `NonRetryableError`: Marks job as "failed", moves to failed queue
 *    - On `RetryableError`: Increments attempt count, waits backoff delay, retries
 *    - After max attempts: Marks job as "failed" even for retryable errors
 *
 * ## Usage in Workers:
 *
 * ```typescript
 * export async function smsWorker(job: Job) {
 *   // Validation phase - throw NonRetryableError for config issues
 *   if (!apiKey) {
 *     throw new NonRetryableError('API key missing', ESmsErrorCode.API_KEY_REQUIRED);
 *   }
 *
 *   try {
 *     // Execution phase - API calls that might fail temporarily
 *     await sendSms({ to, message, apiKey });
 *   } catch (error) {
 *     // handleWorkerError classifies the error automatically
 *     handleWorkerError(error, 'SMS'); // throws NonRetryableError or RetryableError
 *   }
 * }
 * ```
 *
 * ## What Happens After Throwing:
 *
 * - **NonRetryableError thrown** → BullMQ catches → Job fails immediately → No retry
 * - **RetryableError thrown** → BullMQ catches → Job retries (2s, 4s, 8s delays) → Max 3 attempts
 * - **After max retries** → Job moves to "failed" queue → Can be manually retried or investigated
 */

import {
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
  EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
  EWhatsAppErrorCode.RECIPIENT_INVALID,

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
 * Wraps API call errors with proper classification for BullMQ retry logic
 *
 * This function determines if an error should trigger job retry or fail immediately:
 * - NonRetryableError → Job fails immediately (no retry)
 * - RetryableError → BullMQ retries job according to RETRY_CONFIG
 *
 * Error Classification Flow:
 * 1. If error is already NonRetryableError → re-throw (fail immediately)
 * 2. Try to extract error code from error message (e.g., "API_KEY_INVALID")
 * 3. Check if error code is in NON_RETRYABLE_ERROR_CODES list
 * 4. If non-retryable → throw NonRetryableError (fail immediately)
 * 5. Otherwise → throw RetryableError (trigger retry)
 *
 * @param error - The caught error from API call or operation
 * @param channel - Which channel this error is from (for logging)
 * @throws {NonRetryableError} - For permanent failures (no retry)
 * @throws {RetryableError} - For temporary failures (will retry)
 *
 * @example
 * // In worker processor catch block:
 * try {
 *   const result = await sendSms({ to, message, apiKey });
 *   return { success: true, ...result };
 * } catch (error) {
 *   // This will throw either NonRetryableError or RetryableError
 *   // BullMQ will then either fail immediately or retry the job
 *   handleWorkerError(error, 'SMS');
 * }
 */
export function handleWorkerError(
  error: unknown,
  channel: "SMS" | "WhatsApp" | "Voice",
): never {
  if (error instanceof NonRetryableError) {
    // Re-throw to fail job immediately without retry
    throw error;
  }

  if (error instanceof Error) {
    // Check if error message contains known non-retryable codes
    const errorCode = extractErrorCode(error.message);

    if (errorCode && !isRetryableErrorCode(errorCode)) {
      throw new NonRetryableError(error.message, errorCode, error);
    }

    // Default: treat as retryable
    throw new RetryableError(`${channel} send failed: ${error.message}`, error);
  }

  throw new RetryableError(`${channel} send failed: Unknown error`);
}

function extractErrorCode(message: string): string | null {
  // Try to extract error code from message (e.g., "API_KEY_INVALID")
  const match = message.match(/\b[A-Z_]{3,}\b/);
  return match ? match[0] : null;
}
