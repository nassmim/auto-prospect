/**
 * Database Client Wrappers
 *
 * ORM-agnostic interface for database access.
 * This layer decouples consuming code from the underlying ORM (currently Drizzle).
 */

import { defaultDBClient, createDrizzle, decode } from "./drizzle/client";

/**
 * Gets database client with admin privileges (bypasses RLS)
 * Use in: workers, system tasks, migrations, cron jobs
 *
 * @returns Database client with full admin access
 */
export function getDBAdminClient() {
  return defaultDBClient;
}

/**
 * Gets database client with RLS enforced (user context)
 * Use in: web app server actions, API routes, user-triggered operations
 *
 * @param accessToken - JWT access token from authenticated user
 * @returns Database client with RLS policies enforced
 */
export function getDBWithRLSClient(accessToken: string) {
  return createDrizzle(decode(accessToken), {
    admin: defaultDBClient,
    client: defaultDBClient,
  });
}
