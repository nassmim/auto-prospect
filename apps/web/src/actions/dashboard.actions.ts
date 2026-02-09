"use server";

import { getDashboardStats } from "@/services/dashboard.service";
import { getActiveHunts } from "@/services/hunt.service";

/**
 * Fetches dashboard statistics for the current user's account
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchDashboardStats() {
  return getDashboardStats();
}

/**
 * Fetches active hunts with summary data for dashboard
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchActiveHunts() {
  return getActiveHunts();
}
