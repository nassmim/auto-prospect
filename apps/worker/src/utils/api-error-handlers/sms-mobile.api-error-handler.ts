import { ESmsErrorCode } from "@auto-prospect/shared";
import { UnrecoverableError } from "bullmq";
import { isRetryableHttpCode } from "../../config/worker.config";

/**
 * SMSMobileAPI Error Handler
 *
 * API Documentation: https://www.smsmobileapi.com/documentation/
 *
 * RETRYABLE (throw standard Error):
 * - HTTP 5xx: Server errors
 * - HTTP 429: Rate limited
 * - Network timeouts
 *
 * NON-RETRYABLE (throw UnrecoverableError):
 * - HTTP 401: Invalid API key
 * - HTTP 400: Invalid phone number format
 * - "invalid_recipient": Phone number not valid for SMS
 *
 * TODO: Add specific error response parsing once API error format is documented
 * Example placeholder for API-specific response handling:
 *
 * if (response.error === 'invalid_api_key') {
 *   throw new UnrecoverableError(`Invalid SMS API key (${ESmsErrorCode.API_KEY_INVALID})`);
 * }
 * if (response.error === 'invalid_number') {
 *   throw new UnrecoverableError(`Invalid phone number (${ESmsErrorCode.PHONE_NUMBER_INVALID})`);
 * }
 */
export function handleSmsApiResponse(
  response: Response,
  _data: unknown,
): void {
  if (!response.ok) {
    if (response.status === 401) {
      throw new UnrecoverableError(
        `Invalid API key (${ESmsErrorCode.API_KEY_INVALID})`,
      );
    }

    if (isRetryableHttpCode(response.status)) {
      throw new Error(`SMS API error: ${response.status}`);
    }

    throw new UnrecoverableError(
      `SMS API error: ${response.status} (${ESmsErrorCode.MESSAGE_SEND_FAILED})`,
    );
  }

  // TODO: Parse API-specific error responses from _data object
}
