/**
 * Centralized routes configuration
 * Single source of truth for all application routes
 */

export const pages = {
  // Authentication
  login: "/login",

  // Main app sections
  dashboard: "/dashboard",
  pipeline: "/pipeline",
  settings: "/settings",
  credits: "/credits",

  // Hunts routes
  hunts: {
    list: "/hunts",
    new: "/hunts/new",
    detail: (huntId: string) => `/hunts/${huntId}`,
    edit: (huntId: string) => `/hunts/${huntId}/edit`,
  },

  // Leads routes
  leads: {
    list: "/leads",
    detail: (leadId: string) => `/leads/${leadId}`,
  },

  // Templates routes
  templates: {
    list: "/templates",
    new: (channel?: string) =>
      channel ? `/templates/new?channel=${channel}` : "/templates/new",
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
