# Task ID: 78

**Title:** Performance Testing and Bundle Size Validation

**Status:** cancelled

**Dependencies:** 71 ✓, 72 ✓, 73 ✓, 74 ✓, 75 ✓

**Priority:** medium

**Description:** Measure and validate performance metrics across all SWR migrations: request deduplication, polling behavior, no infinite loops, and acceptable bundle size increase.

**Details:**

Performance validation checklist:

1. **Bundle Size**: Run `pnpm build` and compare total bundle size before/after. SWR should add ~5KB gzipped. Total increase should be <10KB. Check with `npx @next/bundle-analyzer` or build output.

2. **Request Deduplication** (Lead Drawer): Open/close same drawer 5x within 5 seconds. Count server requests in Network tab — should see 1-2 requests max (dedupingInterval: 5000ms).

3. **Polling Intervals**: Leave dashboard open 5+ minutes. Count polling requests — should see ~5 requests (one per 60s). Leave kanban open 2+ minutes — should see ~4 requests (one per 30s).

4. **No Infinite Loops**: Monitor Network tab on all migrated pages for 2 minutes. Verify no rapid-fire repeated requests. Check for: SWR key instability (new object reference on each render), missing dedupingInterval, fetcher function recreated on each render.

5. **Server Load**: Compare server logs before/after migration. Polling adds predictable load — verify it's within acceptable bounds.

6. **Hydration**: Check browser console for hydration mismatch warnings on all pages with fallbackData pattern.

7. **Memory**: Monitor React DevTools for memory leaks from SWR cache growth over extended sessions.

**Test Strategy:**

Create a performance test script or manual checklist: (1) `pnpm build` → record bundle sizes. (2) Chrome DevTools Network tab → count requests per page over 5 minutes. (3) React DevTools Profiler → check for unnecessary re-renders. (4) Console → check for hydration warnings. (5) Memory tab → verify no cache memory leaks after 10+ minutes. Document all metrics in a report.
