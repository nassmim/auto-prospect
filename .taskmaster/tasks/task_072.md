# Task ID: 72

**Title:** Add SWR Polling to Dashboard Stats

**Status:** done

**Dependencies:** 69 ✓, 70 ✓

**Priority:** high

**Description:** Convert the Dashboard page to use SWR with polling for automatic stats refresh while preserving server-side initial render for SEO.

**Details:**

Files: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/dashboard-view.tsx`

Current pattern:
- `page.tsx` fetches `getDashboardStats()` and `getActiveHunts()` server-side
- Passes data as props to `DashboardView` client component
- Stats never refresh without full page reload

Migration steps:
1. Keep server-side fetch in `page.tsx` — this provides initial data for SEO and fast first paint.
2. In `DashboardView` (already a client component), add SWR hooks:
```typescript
const { data: stats } = useSWR(
  swrKeys.dashboard.stats,
  () => fetchDashboardStats(),
  {
    fallbackData: initialStats, // from server-rendered props
    refreshInterval: SWR_POLLING.DASHBOARD, // 60s
    revalidateOnFocus: true,
  }
);

const { data: activeHunts } = useSWR(
  swrKeys.hunts.active,
  () => fetchActiveHunts(),
  {
    fallbackData: initialActiveHunts,
    refreshInterval: SWR_POLLING.DASHBOARD,
  }
);
```
3. Replace direct prop usage with SWR data (which falls back to props on first render).
4. Add an 'Updated X seconds ago' text indicator using `useSWR`'s `isValidating` state and a simple timestamp.
5. Ensure `page.tsx` still passes `initialStats` and `initialActiveHunts` as props — these become `fallbackData`.
6. The component type signature changes: props become initial/fallback data rather than the only data source.

**Test Strategy:**

Load dashboard → verify initial data renders immediately (no loading spinner). Wait 60+ seconds → verify stats update automatically in Network tab. Switch to another tab and back → verify revalidation fires (revalidateOnFocus). Verify 'Updated X ago' indicator updates. Check that server-side HTML includes initial stats (view source for SEO verification).
