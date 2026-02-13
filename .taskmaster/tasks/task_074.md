# Task ID: 74

**Title:** Add SWR Polling to Credits Page

**Status:** done

**Dependencies:** 69 ✓, 70 ✓

**Priority:** medium

**Description:** Convert the Credits page to use SWR with polling so users see real-time balance updates as hunts consume credits.

**Details:**

Files: `src/app/(app)/credits/page.tsx`, `src/components/credits/credits-view.tsx`

Current pattern:
- `page.tsx` fetches `getAccountCredits()` server-side
- Passes data to `CreditsView` client component
- No polling — balance changes invisible during active hunts

Migration steps:
1. Keep server-side fetch in `page.tsx` for initial data and SEO.
2. In `CreditsView`, add SWR hook:
```typescript
const { data: credits, isValidating } = useSWR(
  swrKeys.credits.balance,
  () => fetchAccountCredits(),
  {
    fallbackData: initialCredits,
    refreshInterval: SWR_POLLING.CREDITS, // 60s
    revalidateOnFocus: true,
  }
);
```
3. Add a subtle visual indicator when balance changes (e.g., brief highlight animation on the balance number using CSS transition).
4. Update `page.tsx` props to pass `initialCredits` as fallback.
5. Optionally show a small `isValidating` spinner near the balance to indicate refresh is happening.

**Test Strategy:**

Load credits page → verify initial data renders immediately. Start a hunt that consumes credits → wait 60s on credits page → verify balance decrements. Switch tabs and return → verify revalidation. Verify visual change indicator appears when balance updates. Check that server-rendered HTML includes initial balance (SEO).
