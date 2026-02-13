import { TErrorCode } from "../config/error-codes";

/**
 * Generic result type for server actions
 * Standardizes success/error responses across the application
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errorCode: TErrorCode; message?: string };

/**
 * Helper to create success result
 */
export const actionSuccess = <T>(data: T): ActionResult<T> => ({
  success: true,
  data,
});

/**
 * Helper to create error result
 */
export const actionError = <T>(
  errorCode: TErrorCode,
  message?: string
): ActionResult<T> => ({
  success: false,
  errorCode,
  message,
});
