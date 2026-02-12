import { EVoiceErrorCode } from "@auto-prospect/shared";
import { isRetryableHttpCode } from "../../config/worker.config";
import { NonRetryableError, RetryableError } from "../error-handler.utils";

/**
 * Voice Partner API Error Handler
 *
 * API Documentation: https://api.voicepartner.fr/documentation
 *
 * RETRYABLE:
 * - HTTP 5xx, 429
 * - "service_unavailable"
 *
 * NON-RETRYABLE:
 * - "invalid_token": Audio token not found
 * - "invalid_phone": Invalid phone format
 * - "insufficient_credits": Account balance too low
 *
 * TODO: Map actual API error codes once integration is tested
 */
export function handleVoiceApiResponse(
  response: Response,
  _data: Record<string, unknown>,
): void {
  if (!response.ok) {
    if (response.status === 401) {
      throw new NonRetryableError(
        "Invalid API key",
        EVoiceErrorCode.API_KEY_INVALID,
      );
    }

    if (isRetryableHttpCode(response.status)) {
      throw new RetryableError(`Voice API error: ${response.status}`);
    }

    throw new NonRetryableError(
      `Voice API error: ${response.status}`,
      EVoiceErrorCode.MESSAGE_SEND_FAILED,
    );
  }

  // Placeholder for Voice Partner specific error handling
  // TODO: Add actual API response parsing using _data object
}
