import { EWhatsAppErrorCode } from "@auto-prospect/shared";
import { isRetryableHttpCode } from "../../config/worker.config";
import { NonRetryableError, RetryableError } from "../error-handler.utils";

/**
 * WhatsApp API Error Handler
 *
 * RETRYABLE:
 * - HTTP 5xx: Server errors
 * - HTTP 429: Rate limited
 * - Network timeouts
 * - CONNECTION_TIMEOUT: Temporary connection issue
 *
 * NON-RETRYABLE:
 * - SESSION_NOT_FOUND: WhatsApp session doesn't exist
 * - SESSION_EXPIRED: Need to reconnect WhatsApp
 * - RECIPIENT_INVALID: Phone number format invalid
 * - ACCOUNT_NOT_FOUND: Account doesn't exist
 *
 * TODO: Add specific error response parsing based on actual WhatsApp API responses
 */
export function handleWhatsAppApiResponse(
  response: Response,
  _data: unknown,
): void {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new NonRetryableError(
        "WhatsApp session not found or expired",
        EWhatsAppErrorCode.SESSION_NOT_FOUND,
      );
    }

    if (response.status === 404) {
      throw new NonRetryableError(
        "WhatsApp account not found",
        EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
      );
    }

    if (isRetryableHttpCode(response.status)) {
      throw new RetryableError(`WhatsApp API error: ${response.status}`);
    }

    throw new NonRetryableError(
      `WhatsApp API error: ${response.status}`,
      EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
    );
  }

  // TODO: Parse API-specific error responses from _data object
  // Example:
  // if (_data && typeof _data === 'object' && 'error' in _data) {
  //   const errorData = _data as { error: string };
  //   if (errorData.error === 'RECIPIENT_INVALID') {
  //     throw new NonRetryableError('Invalid recipient', EWhatsAppErrorCode.RECIPIENT_INVALID);
  //   }
  // }
}
