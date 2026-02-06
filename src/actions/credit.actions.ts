"use server";

import { getAccountCredits } from "@/services/credit.service";

/**
 * Fetches complete credit data for the authenticated user's account
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchAccountCredits() {
  return getAccountCredits();
}
