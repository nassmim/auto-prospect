import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

export type PhoneValidationResult = {
  isValid: boolean;
  formatted: string | null; // E.164 format without + (e.g., "33612345678")
  formattedWithPlus: string | null; // E.164 format with + (e.g., "+33612345678")
  error?: string;
};

/**
 * Validates and formats a phone number for WhatsApp
 * @param phoneNumber - The phone number to validate (can include +, spaces, dashes)
 * @param defaultCountry - Default country code if not included in number (e.g., "FR")
 * @returns Validation result with formatted number or error
 */
export const validateWhatsAppNumber = (
  phoneNumber: string,
  defaultCountry: CountryCode = "FR",
): PhoneValidationResult => {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return {
      isValid: false,
      formatted: null,
      formattedWithPlus: null,
      error: "Renseigne ton numéro de téléphone",
    };
  }

  const cleanedNumber = phoneNumber.trim();

  try {
    // Check if the number is valid
    if (!isValidPhoneNumber(cleanedNumber, defaultCountry)) {
      return {
        isValid: false,
        formatted: null,
        formattedWithPlus: null,
        error: "Ton numéro n'est pas valide, vérifie le format",
      };
    }

    // Parse and format the number
    const parsed = parsePhoneNumber(cleanedNumber, defaultCountry);

    if (!parsed) {
      return {
        isValid: false,
        formatted: null,
        formattedWithPlus: null,
        error: "Ton numéro n'est pas valide, vérifie le format",
      };
    }

    // E.164 format: +33612345678
    const e164 = parsed.format("E.164");

    return {
      isValid: true,
      formatted: e164.replace("+", ""), // 33612345678 (for Baileys)
      formattedWithPlus: e164, // +33612345678 (for display)
    };
  } catch {
    return {
      isValid: false,
      formatted: null,
      formattedWithPlus: null,
      error: "Ton numéro n'est pas valide, vérifie le format",
    };
  }
};

/**
 * Formats a phone number to WhatsApp JID format
 * @param phoneNumber - Phone number in E.164 format without + (e.g., "33612345678")
 * @returns WhatsApp JID (e.g., "33612345678@s.whatsapp.net")
 */
export const toWhatsAppJid = (phoneNumber: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `${digitsOnly}@s.whatsapp.net`;
};
