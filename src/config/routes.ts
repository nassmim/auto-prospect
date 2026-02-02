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
    new: (type?: "text" | "voice") =>
      type ? `/templates/new?type=${type}` : "/templates/new",
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

export type StaticRoute = ExtractStaticRoutes<typeof pages>;

/**
 * Backward compatibility aliases
 * @deprecated Use nested structure instead (e.g., pages.hunts.list instead of pages.hunts)
 * These will be removed in the next major version
 */
export const legacyPages = {
  hunts: pages.hunts.list,
  huntsNew: pages.hunts.new,
  leads: pages.leads.list,
  templates: pages.templates.list,
  templatesNew: pages.templates.new(),
} as const;
