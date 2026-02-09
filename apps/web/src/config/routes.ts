/**
 * Centralized routes configuration
 * Single source of truth for all application routes
 */

const DASHBOARD_PREFIX = "/dashboard";

export const pages = {
  // Authentication
  login: "/login",

  // Main app sections
  dashboard: `${DASHBOARD_PREFIX}`,
  pipeline: `${DASHBOARD_PREFIX}/pipeline`,
  settings: `${DASHBOARD_PREFIX}/settings`,
  credits: `${DASHBOARD_PREFIX}/credits`,

  // Hunts routes
  hunts: {
    list: `${DASHBOARD_PREFIX}/hunts`,
    new: `${DASHBOARD_PREFIX}/hunts/new`,
    detail: (huntId: string) => `${DASHBOARD_PREFIX}/hunts/${huntId}`,
    edit: (huntId: string) => `${DASHBOARD_PREFIX}/hunts/${huntId}/edit`,
  },

  // Leads routes
  leads: {
    list: `${DASHBOARD_PREFIX}/leads`,
    detail: (leadId: string) => `${DASHBOARD_PREFIX}/leads/${leadId}`,
  },

  // Templates routes
  templates: {
    list: `${DASHBOARD_PREFIX}/templates`,
    new: (channel?: string) =>
      channel
        ? `${DASHBOARD_PREFIX}/templates/new?channel=${channel}`
        : `${DASHBOARD_PREFIX}/templates/new`,
  },
} as const;

/**
 * Extract all static route values (string literals only, not functions)
 * Useful for contexts that only accept string paths (e.g., revalidatePath)
 */
type ExtractStaticRoutes<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]: ExtractStaticRoutes<T[K]> }[keyof T]
    : never;

export type TStaticRoute = ExtractStaticRoutes<typeof pages>;
