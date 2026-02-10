# Task ID: 70

**Title:** Create Reusable SWR Hook Utilities

**Status:** done

**Dependencies:** 68 ✓

**Priority:** medium

**Description:** Create shared custom hooks and utilities for common SWR patterns used across the migration (fetcher helpers, optimistic update utilities, polling configuration).

**Details:**

Create `src/hooks/use-swr-action.ts` with reusable SWR utilities:

1. **Generic fetcher wrapper** for server actions:
```typescript
// Wraps a server action into an SWR-compatible fetcher
export function createActionFetcher<T>(action: () => Promise<T>) {
  return () => action();
}

// For parameterized fetchers
export function createParamFetcher<T, P extends unknown[]>(
  action: (...params: P) => Promise<T>
) {
  return (_key: string | readonly unknown[], ...params: P) => action(...params);
}
```

2. **Optimistic update helper**:
```typescript
export function useOptimisticMutation<T>(
  key: string | readonly unknown[],
  mutationFn: () => Promise<void>,
  optimisticData: T | ((current: T) => T)
) {
  // Uses useSWRMutation or manual mutate() with rollback
}
```

3. **Polling configuration constants**:
```typescript
export const SWR_POLLING = {
  DASHBOARD: 60_000,  // 60s
  KANBAN: 30_000,     // 30s
  CREDITS: 60_000,    // 60s
} as const;
```

Keep it minimal — only add utilities that are actually used by 2+ components. Avoid premature abstraction.

**Test Strategy:**

Write unit tests for createActionFetcher and createParamFetcher to verify they correctly invoke the wrapped server action and return its result. Test optimistic update helper with mock mutate function. Verify TypeScript inference works correctly for generic types.
