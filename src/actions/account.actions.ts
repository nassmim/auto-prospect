"use server";

import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";

/**
 * Gets the user's current plan
 * We mock the function so far until we truly implement it
 */
export const getUserPlan = async (
  organizationId: string,
  dbClient: TDBClient,
) => {
  const client = dbClient || (await createDrizzleSupabaseClient());
  return organizationId ? 1 : null;
};
