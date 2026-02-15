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
  NOT_FOUND = "NOT_FOUND",
  FORBIDDEN = "FORBIDDEN",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
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
// VOICE ERROR CODES
// =============================================================================

export enum EVoiceErrorCode {
  // API Key errors
  API_KEY_MISSING = "API_KEY_MISSING",
  API_KEY_INVALID = "API_KEY_INVALID",

  // Phone number errors
  PHONE_NUMBER_REQUIRED = "PHONE_NUMBER_REQUIRED",
  PHONE_NUMBER_INVALID = "PHONE_NUMBER_INVALID",

  // Audio errors
  AUDIO_TOKEN_REQUIRED = "AUDIO_TOKEN_REQUIRED",
  AUDIO_TOKEN_INVALID = "AUDIO_TOKEN_INVALID",

  // Message errors
  MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",

  // API errors
  API_ERROR = "API_ERROR",
}

export type TVoiceErrorCode = EVoiceErrorCode;

// =============================================================================
// AUTH ERROR CODES
// =============================================================================

export enum EAuthErrorCode {
  // Authentication errors
  SIGNUP_NOT_ALLOWED = "SIGNUP_NOT_ALLOWED",
  AUTH_ERROR = "AUTH_ERROR",
}

export type TAuthErrorCode = EAuthErrorCode;

// =============================================================================
// WORKER ERROR CODES (for API routes)
// =============================================================================

export enum EWorkerErrorCode {
  // Queue errors
  HUNT_EXECUTION_FAILED = "HUNT_EXECUTION_FAILED",
  HUNT_STATUS_FETCH_FAILED = "HUNT_STATUS_FETCH_FAILED",
  SMS_QUEUE_FAILED = "SMS_QUEUE_FAILED",
  VOICE_QUEUE_FAILED = "VOICE_QUEUE_FAILED",
  WHATSAPP_QUEUE_FAILED = "WHATSAPP_QUEUE_FAILED",
  JOB_STATUS_FETCH_FAILED = "JOB_STATUS_FETCH_FAILED",
  QUEUE_STATS_FETCH_FAILED = "QUEUE_STATS_FETCH_FAILED",

  // Validation errors
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_QUEUE_NAME = "INVALID_QUEUE_NAME",
  JOB_NOT_FOUND = "JOB_NOT_FOUND",
  QUEUE_NOT_FOUND = "QUEUE_NOT_FOUND",
}

export type TWorkerErrorCode = EWorkerErrorCode;

// =============================================================================
// ALL ERROR CODES (union type)
// =============================================================================

export type TErrorCode =
  | TWhatsAppErrorCode
  | TGeneralErrorCode
  | TSmsErrorCode
  | TVoiceErrorCode
  | TAuthErrorCode
  | TWorkerErrorCode;
