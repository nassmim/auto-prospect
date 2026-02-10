/**
 * Message Service - Worker Context
 *
 * Reusable message utilities for workers
 */

import parsePhoneNumber from "libphonenumber-js";

/**
 * Normalizes phone number to E.164 format (+33612345678)
 * Returns null if invalid
 */
export function formatPhoneNumber(phone: string, country: "FR" = "FR"): string | null {
  if (!phone) return null;

  const parsed = parsePhoneNumber(phone, country);
  return parsed?.number || null;
}

/**
 * Personalizes message template with provided data
 * Replaces {{variable}} placeholders with actual values
 */
export function personalizeMessage(
  template: string,
  data: Record<string, string | number | undefined | null>
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
 * Extracts WhatsApp JID from phone number
 * Converts "+33612345678" to "33612345678@s.whatsapp.net"
 */
export function getWhatsAppJID(phone: string): string {
  const cleaned = phone.replace(/^\+/, "");
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Validates message content length for different channels
 */
export function validateMessageLength(message: string, channel: "sms" | "whatsapp" | "voice"): {
  valid: boolean;
  maxLength: number;
  currentLength: number;
} {
  const limits = {
    sms: 160,
    whatsapp: 4096,
    voice: 1000,
  };

  const maxLength = limits[channel];
  const currentLength = message.length;

  return {
    valid: currentLength <= maxLength,
    maxLength,
    currentLength,
  };
}
