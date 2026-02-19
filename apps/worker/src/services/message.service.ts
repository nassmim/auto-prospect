/**
 * Message Service - Worker Context
 *
 * Reusable message utilities for workers
 */

import {
  CountryCode,
  E164Number,
  EContactChannel,
  parsePhoneNumberWithError,
  TContactChannel,
} from "@auto-prospect/shared";
import { UnrecoverableError } from "bullmq";

/**
 * Normalizes phone number to E.164 format (+33612345678)
 * Returns null if invalid
 */
export function formatPhoneNumber(
  phone: string,
  country: CountryCode = "FR",
): E164Number | undefined | null {
  if (!phone) return null;

  const parsed = parsePhoneNumberWithError(phone, country);
  return parsed?.number;
}

/**
 * Sends SMS using SMSMobileAPI provider
 *
 * API Response Format (TO BE VERIFIED WITH ACTUAL API):
 * Success: { message_id: "..." }
 * Error: Unknown - needs real API testing
 *
 * Error Handling Strategy:
 * Each error type needs specific handling based on SMSMobileAPI behavior.
 * Some errors trigger BullMQ retry, others need custom retry logic.
 */
export async function sendSms({
  to,
  message,
  apiKey,
}: {
  to: string;
  message: string;
  apiKey: string;
}) {
  const body = new URLSearchParams();
  body.set("apikey", apiKey);
  body.set("recipients", to);
  body.set("message", message);
  body.set("sendsms", "1");

  const response = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  // ===== ERROR HANDLING =====
  // TODO: Implement after testing with real SMSMobileAPI responses
  // Each error type needs investigation to determine:
  // 1. Is it retryable or permanent?
  // 2. If retryable, what strategy? (BullMQ auto-retry vs custom delay)
  // 3. What's the actual error field in the response?

  // PLACEHOLDER: HTTP-level error detection
  if (!response.ok) {
    // TODO: Test actual API behavior for each HTTP status code
    // 401 Unauthorized: Invalid API key → permanent failure
    // 400 Bad Request: Invalid phone number? → permanent failure
    // 429 Rate Limited: Need custom backoff strategy? Or let BullMQ handle?
    // 503 Service Unavailable: Temporary → BullMQ retry
    // 500 Server Error: Temporary → BullMQ retry

    throw new UnrecoverableError(`SMS_API_HTTP_${response.status}`);
  }

  const data = await response.json();

  // PLACEHOLDER: API-specific error responses in success (200) responses
  // TODO: Some APIs return 200 OK with error details in response body
  // Example scenarios to test:
  // - Invalid phone format: data.error === 'invalid_recipient'?
  // - Insufficient balance: data.error === 'low_balance'?
  // - Rate limit in body: data.error === 'rate_exceeded'?

  // if (data.error) {
  //   switch (data.error) {
  //     case 'invalid_recipient':
  //       throw new UnrecoverableError(ESmsErrorCode.PHONE_NUMBER_INVALID);
  //     case 'rate_exceeded':
  //       // Custom retry with delay?
  //       await new Promise(resolve => setTimeout(resolve, 5000));
  //       throw new Error('RATE_LIMIT_RETRY');
  //     case 'low_balance':
  //       throw new UnrecoverableError(ESmsErrorCode.MESSAGE_SEND_FAILED);
  //     default:
  //       throw new Error(`SMS_API_ERROR_${data.error}`);
  //   }
  // }

  return data as { message_id: string };
}

/**
 * Personalizes message template with provided data
 * Replaces {{variable}} placeholders with actual values
 */
export function personalizeMessage(
  template: string,
  data: Record<string, string | number | undefined | null>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const replacement = value?.toString() || "";
    result = result.replace(new RegExp(placeholder, "g"), replacement);
  }

  return result;
}

/**
 * Validates message content length for different channels
 */
export function validateMessageLength(
  message: string,
  channel: TContactChannel,
): {
  valid: boolean;
  maxLength: number;
  currentLength: number;
} {
  const limits = {
    [EContactChannel.SMS]: 160,
    [EContactChannel.WHATSAPP_TEXT]: 4096,
    [EContactChannel.RINGLESS_VOICE]: 1000,
  };

  const maxLength = limits[channel];
  const currentLength = message.length;

  return {
    valid: currentLength <= maxLength,
    maxLength,
    currentLength,
  };
}

/**
 * Sends a voice message via Voice Partner API
 *
 * API Response Format (TO BE VERIFIED WITH ACTUAL API):
 * Success: Unknown - needs real API testing
 * Error: Unknown - needs real API testing
 *
 * Error Handling Strategy:
 * Each error type needs specific handling based on Voice Partner API behavior.
 * Some errors trigger BullMQ retry, others need custom retry logic.
 */
export async function sendVoiceMessage({
  phoneNumbers,
  tokenAudio,
  sender,
  emailForNotification,
  scheduledDate,
  apiKey,
}: {
  phoneNumbers: string;
  tokenAudio: string;
  sender?: string;
  emailForNotification?: string;
  scheduledDate?: string;
  apiKey: string;
}): Promise<Record<string, unknown>> {
  const payload: Record<string, string> = {
    apiKey,
    tokenAudio,
    phoneNumbers,
  };

  if (sender) payload.sender = sender;
  if (scheduledDate) payload.scheduledDate = scheduledDate;
  if (emailForNotification) payload.emailForNotification = emailForNotification;

  const response = await fetch("https://api.voicepartner.fr/v1/campaign/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as Record<string, unknown>;

  // ===== ERROR HANDLING =====
  // TODO: Implement after testing with real Voice Partner API responses
  // Each error type needs investigation to determine:
  // 1. Is it retryable or permanent?
  // 2. If retryable, what strategy? (BullMQ auto-retry vs custom delay)
  // 3. What's the actual error structure in the response?

  // PLACEHOLDER: HTTP-level error detection
  if (!response.ok) {
    // TODO: Test actual API behavior for each HTTP status code
    // 401 Unauthorized: Invalid API credentials → permanent failure
    // 400 Bad Request: Invalid phone/token? → permanent failure
    // 429 Rate Limited: Need custom backoff? Or let BullMQ handle?
    // 503 Service Unavailable: Temporary → BullMQ retry
    // 500 Server Error: Temporary → BullMQ retry

    throw new UnrecoverableError(`VOICE_API_HTTP_${response.status}`);
  }

  // PLACEHOLDER: API-specific error responses in success (200) responses
  // TODO: Voice Partner might return 200 OK with error in response body
  // Example scenarios to test:
  // - Invalid audio token: data.status === 'error' && data.code === 'invalid_token'?
  // - Insufficient credits: data.error === 'insufficient_balance'?
  // - Invalid phone format: data.error === 'invalid_recipient'?
  // - Rate limit (daily quota): data.error === 'quota_exceeded'?

  // if (data.status === 'error') {
  //   const errorCode = data.error_code || data.code;
  //
  //   switch (errorCode) {
  //     case 'invalid_token':
  //       throw new UnrecoverableError(EVoiceErrorCode.AUDIO_TOKEN_INVALID);
  //     case 'invalid_phone':
  //       throw new UnrecoverableError(EVoiceErrorCode.PHONE_NUMBER_INVALID);
  //     case 'insufficient_balance':
  //       throw new UnrecoverableError(EVoiceErrorCode.API_ERROR);
  //     case 'quota_exceeded':
  //       // Custom retry: wait until next day?
  //       throw new UnrecoverableError(EVoiceErrorCode.API_ERROR);
  //     case 'service_unavailable':
  //       // Temporary - let BullMQ retry
  //       throw new Error('VOICE_SERVICE_UNAVAILABLE');
  //     default:
  //       throw new Error(`VOICE_API_ERROR_${errorCode}`);
  //   }
  // }

  return data;
}

/**
 * Sends a message to a Slack channel via webhook
 */
export async function sendSlackMessage(message: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  if (!webhook) {
    throw new Error("SLACK_WEBHOOK_URL environment variable is not configured");
  }

  const payload = {
    text: message,
  };

  await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
