/**
 * Error codes for server actions
 * Server returns these codes, client maps them to user-friendly messages
 */

// =============================================================================
// WHATSAPP ERROR CODES
// =============================================================================

export enum EWhatsAppErrorCode {
  // Phone number validation errors
  PHONE_REQUIRED = "PHONE_REQUIRED",
  PHONE_INVALID_FORMAT = "PHONE_INVALID_FORMAT",
  PHONE_UPDATE_FAILED = "PHONE_UPDATE_FAILED",

  // Connection errors
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
  CONNECTION_FAILED = "CONNECTION_FAILED",
  QR_GENERATION_FAILED = "QR_GENERATION_FAILED",

  // Session errors
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED",
  SESSION_DELETE_FAILED = "SESSION_DELETE_FAILED",

  // Account errors
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",

  // Message sending errors
  MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",
  RECIPIENT_INVALID = "RECIPIENT_INVALID",
}

export type TWhatsAppErrorCode = EWhatsAppErrorCode;

// =============================================================================
// GENERAL ERROR CODES
// =============================================================================

export enum EGeneralErrorCode {
  VALIDATION_FAILED = "VALIDATION_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
  DATABASE_ERROR = "DATABASE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export type TGeneralErrorCode = EGeneralErrorCode;

// =============================================================================
// SMS ERROR CODES
// =============================================================================

export enum ESmsErrorCode {
  // API Key errors
  API_KEY_REQUIRED = "API_KEY_REQUIRED",
  API_KEY_INVALID = "API_KEY_INVALID",
  API_KEY_SAVE_FAILED = "API_KEY_SAVE_FAILED",
  ENCRYPTION_KEY_MISSING = "ENCRYPTION_KEY_MISSING",

  // Phone number errors
  PHONE_NUMBER_REQUIRED = "PHONE_NUMBER_REQUIRED",
  PHONE_NUMBER_INVALID = "PHONE_NUMBER_INVALID",

  // Message errors
  MESSAGE_REQUIRED = "MESSAGE_REQUIRED",
  MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",

  // Account errors
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
}

export type TSmsErrorCode = ESmsErrorCode;

// =============================================================================
// ALL ERROR CODES (union type)
// =============================================================================

export type TErrorCode = TWhatsAppErrorCode | TGeneralErrorCode | TSmsErrorCode;
