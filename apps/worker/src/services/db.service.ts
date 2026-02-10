/**
 * Database Service - Worker Context
 *
 * Database client utilities for workers
 * Workers ALWAYS use admin context (bypass RLS)
 */

import { createDrizzleAdmin } from "@auto-prospect/db";

/**
 * Gets admin database client for worker operations
 * Workers operate in system context and bypass RLS by default
 *
 * @returns Database client with admin privileges
 */
export function getAdminClient() {
  return createDrizzleAdmin();
}
