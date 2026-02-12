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
 * Wraps API call errors with proper classification
 *
 * @example
 * // In worker processor:
 * try {
 *   const result = await sendSms({ to, message, apiKey });
 *   return { success: true, ...result };
 * } catch (error) {
 *   return handleWorkerError(error, 'SMS');
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
