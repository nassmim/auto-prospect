import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from "@auto-prospect/shared";
import {
  EWhatsAppErrorCode,
  TWhatsAppErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";

export type TPhoneValidationResult = {
  isValid: boolean;
  formatted: string | null; // E.164 format without + (e.g., "33612345678")
  formattedWithPlus: string | null; // E.164 format with + (e.g., "+33612345678")
  errorCode?: TWhatsAppErrorCode;
};

/**
 * Validates and formats a phone number for WhatsApp
 * @param phoneNumber - The phone number to validate (can include +, spaces, dashes)
 * @param defaultCountry - Default country code if not included in number (e.g., "FR")
 * @returns Validation result with formatted number or error code
 */
export const validateWhatsAppNumber = (
  phoneNumber: string,
  defaultCountry: CountryCode = "FR",
): TPhoneValidationResult => {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return {
      isValid: false,
      formatted: null,
      formattedWithPlus: null,
      errorCode: EWhatsAppErrorCode.PHONE_REQUIRED,
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
        errorCode: EWhatsAppErrorCode.PHONE_INVALID_FORMAT,
      };
    }

    // Parse and format the number
    const parsed = parsePhoneNumberWithError(cleanedNumber, defaultCountry);

    if (!parsed) {
      return {
        isValid: false,
        formatted: null,
        formattedWithPlus: null,
        errorCode: EWhatsAppErrorCode.PHONE_INVALID_FORMAT,
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
      errorCode: EWhatsAppErrorCode.PHONE_INVALID_FORMAT,
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
