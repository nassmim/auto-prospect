/**
 * Centralized pages configuration
 * Single source of truth for all application pages
 */

export const pages = {
  // Authentication
  login: "/login",

  // Main app sections
  dashboard: "/dashboard",
  hunts: "/hunts",
  pipeline: "/pipeline",
  templates: "/templates",
  settings: "/settings",
  credits: "/credits",
  leads: "/leads",

  // Nested pages
  hunts_new: "/hunts/new",
  hunts_create: "/hunts/create",
  templates_new: "/templates/new",
} as const;

/**
 * Type-safe Page keys
 */
export type PageKey = keyof typeof pages;

/**
 * Type for all possible Page values
 */
export type PageValue = (typeof pages)[PageKey];
