import { z } from "zod";

/**
 * Formats Zod validation error into a user-friendly French error message
 *
 * Extracts the first field error from a ZodError and returns it as a string.
 * Falls back to a generic message if no specific field error is found.
 *
 * @param error - The ZodError from schema validation
 * @returns A French error message describing the validation failure
 *
 * @example
 * ```typescript
 * const result = huntFormSchema.safeParse(data);
 * if (!result.success) {
 *   const errorMessage = formatZodError(result.error);
 *   throw new Error(errorMessage);
 * }
 * ```
 */
export function formatZodError(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const firstError = Object.values(fieldErrors).flat()[0] as string | undefined;
  return firstError ?? "Données de formulaire invalides";
}
