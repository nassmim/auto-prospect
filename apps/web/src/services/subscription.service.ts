import { createDrizzleSupabaseClient } from "@/lib/db";
import { TDBWithTokenClient } from "@auto-prospect/db";

/**
 * Gets the user's current plan
 * We mock the function so far until we truly implement it
 */
export const getUserPlan = async (
  accountId: string,
  dbClient: TDBWithTokenClient,
) => {
  const client = dbClient || (await createDrizzleSupabaseClient());
  return accountId ? 1 : null;
};
