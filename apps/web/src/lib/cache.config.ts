/**
 * Cache tag constants for consistent tagging across the application
 * Used with Next.js 16 'use cache' directive and updateTag()
 */
export const CACHE_TAGS = {
  // Hunt configuration (without credits)
  huntsByAccount: (accountId: string) => `hunts:${accountId}`,
  hunt: (id: string) => `hunt:${id}`,

  // Message templates
  templatesByAccount: (accountId: string) => `templates:${accountId}`,

  // Team members
  teamMembersByAccount: (accountId: string) => `team-members:${accountId}`,

  // Account-specific data
  account: (id: string) => `account:${id}`,
} as const;
