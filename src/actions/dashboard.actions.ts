"use server";

import { getDashboardStats, getActiveHunts } from "@/services/dashboard.service";

/**
 * Dashboard actions and type re-exports
 * This file re-exports types from service/types layers for backward compatibility
 * with components that import from @/actions/dashboard.actions
 */

export type { TDashboardStats as DashboardStats } from "@/types/general.types";
export type { THuntSummary as HuntSummary } from "@/types/hunt.types";

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
