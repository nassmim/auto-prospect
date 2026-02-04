/**
 * SWR Cache Keys Configuration
 *
 * Centralized cache keys for all SWR data fetching.
 * NEVER hardcode cache keys in components - use these exports.
 *
 * Pattern: Follow same structure as routes.ts for consistency
 *
 * Usage:
 * - String keys for singleton data: swrKeys.dashboard.stats
 * - Function keys for parameterized data: swrKeys.leads.drawer(leadId)
 * - Returns arrays marked 'as const' for type safety
 */

export const swrKeys = {
  dashboard: {
    stats: "dashboard-stats",
  },

  leads: {
    pipeline: "pipeline-leads",
    drawer: (leadId: string) => ["lead-drawer", leadId] as const,
    detail: (leadId: string) => ["lead-detail", leadId] as const,
    messages: (leadId: string) => ["lead-messages", leadId] as const,
    activities: (leadId: string) => ["lead-activities", leadId] as const,
  },

  hunts: {
    list: "account-hunts",
    active: "active-hunts",
    detail: (huntId: string) => ["hunt-detail", huntId] as const,
  },

  credits: {
    balance: "account-credits",
    history: "credits-history",
  },

  templates: {
    list: "account-templates",
    detail: (templateId: string) => ["template-detail", templateId] as const,
    whatsapp: "whatsapp-templates",
    sms: "sms-templates",
    voice: "voice-templates",
  },

  settings: {
    account: "account-settings",
    members: "team-members",
    invitations: "account-invitations",
  },
} as const;

/**
 * Type-safe SWR key type
 * Useful for custom hooks that accept cache keys
 */
export type TSWRKey = string | readonly unknown[];
