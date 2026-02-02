/**
 * SWR Hook Utilities for Server Actions
 *
 * Reusable utilities for integrating server actions with SWR hooks.
 * Provides fetcher wrappers and polling configurations.
 */

/**
 * Creates an SWR-compatible fetcher from a parameterless server action
 *
 * @example
 * const fetcher = createActionFetcher(fetchDashboardStats);
 * const { data } = useSWR('dashboard-stats', fetcher);
 */
export function createActionFetcher<T>(action: () => Promise<T>) {
  return () => action();
}

/**
 * Creates an SWR-compatible fetcher from a parameterized server action
 *
 * SWR passes the cache key as the first argument to the fetcher.
 * This wrapper extracts the parameters from the key array and passes them to the action.
 *
 * @example
 * const fetcher = createParamFetcher(fetchLeadDetails);
 * const { data } = useSWR(['lead-detail', leadId], fetcher);
 * // Calls: fetchLeadDetails(leadId)
 */
export function createParamFetcher<P extends unknown[], T>(
  action: (...params: P) => Promise<T>,
) {
  return (_key: string | readonly unknown[], ...params: P) => action(...params);
}

/**
 * Polling interval configurations for real-time data updates
 *
 * Use these constants with SWR's refreshInterval option:
 * @example
 * useSWR('dashboard-stats', fetcher, { refreshInterval: SWR_POLLING.DASHBOARD });
 */
export const SWR_POLLING = {
  /** Dashboard stats refresh interval (60 seconds) */
  DASHBOARD: 60_000,
  /** Kanban/pipeline view refresh interval (30 seconds) */
  KANBAN: 30_000,
  /** Credits balance refresh interval (60 seconds) */
  CREDITS: 60_000,
} as const;
