/**
 * Message Service - Worker Context
 *
 * Reusable message utilities for workers
 */

import {
  EContactChannel,
  ESmsErrorCode,
  TContactChannel,
} from "@auto-prospect/shared";
import parsePhoneNumber, { CountryCode, E164Number } from "libphonenumber-js";

/**
 * Normalizes phone number to E.164 format (+33612345678)
 * Returns null if invalid
 */
export function formatPhoneNumber(
  phone: string,
  country: CountryCode = "FR",
): E164Number | undefined | null {
  if (!phone) return null;

  const parsed = parsePhoneNumber(phone, country);
  return parsed?.number;
}

/**
 * Sends SMS using SMSMobileAPI provider
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
  if (!apiKey) throw new Error("API key is required");

  const body = new URLSearchParams();
  body.set("apikey", apiKey);
  body.set("recipients", to);
  body.set("message", message);
  body.set("sendsms", "1");

  const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(ESmsErrorCode.MESSAGE_SEND_FAILED);

  return (await res.json()) as { message_id: string };
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
 */
export async function sendVoiceMessage({
  phoneNumbers,
  tokenAudio,
  sender,
  emailForNotification,
  scheduledDate,
  apiKey,
  apiSecret,
}: {
  phoneNumbers: string;
  tokenAudio: string;
  sender?: string;
  emailForNotification?: string;
  scheduledDate?: string;
  apiKey: string;
  apiSecret: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}> {

  const payload: Record<string, string> = {
    apiKey,
    tokenAudio,
    phoneNumbers,
  };

  if (sender) payload.sender = sender;
  if (scheduledDate) payload.scheduledDate = scheduledDate;
  if (emailForNotification) payload.emailForNotification = emailForNotification;

  try {
    const response = await fetch(
      "https://api.voicepartner.fr/v1/campaign/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: (data.message as string) || "Voice Partner API error",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    };
  }
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
