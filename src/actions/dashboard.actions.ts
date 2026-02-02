/**
 * Dashboard actions and type re-exports
 * This file re-exports types from service/types layers for backward compatibility
 * with components that import from @/actions/dashboard.actions
 */

export type { TDashboardStats as DashboardStats } from "@/types/general.types";
export type { THuntSummary as HuntSummary } from "@/types/hunt.types";
