# Task ID: 71

**Title:** Migrate Lead Drawer to SWR with Caching

**Status:** done

**Dependencies:** 69 ✓, 70 ✓

**Priority:** high

**Description:** Replace the useEffect + useTransition data fetching pattern in lead-drawer.tsx with useSWR hooks for automatic caching, deduplication, and revalidation.

**Details:**

File: `src/components/leads/lead-drawer.tsx`

Current pattern (to replace):
- `useEffect` triggers fetch on `leadId` change
- `useTransition` wraps async calls
- `useState` manages lead data, loading, error states
- Re-fetches on every drawer open (no caching)

Migration steps:
1. Replace `useState` + `useEffect` + `useTransition` for lead data with:
```typescript
const { data: lead, error, isLoading, mutate } = useSWR(
  leadId ? swrKeys.leads.drawer(leadId) : null,
  () => fetchLeadDetails(leadId!),
  { dedupingInterval: 5000, revalidateOnFocus: true }
);
```

2. Replace team members fetch similarly:
```typescript
const { data: teamMembers } = useSWR(
  leadId ? swrKeys.settings.members : null,
  () => fetchTeamMembers()
);
```

3. After mutations (stage change, assignment), call `mutate()` to revalidate instead of manual re-fetch.
4. Remove manual loading/error state management — use SWR's `isLoading`, `isValidating`, `error`.
5. Keep the `leadId ? key : null` pattern so SWR doesn't fetch when drawer is closed.
6. Preserve existing optimistic update logic for stage changes and assignments — use `mutate(optimisticData, false)` followed by server action, then `mutate()` to revalidate.
7. Update imports: remove unused `useEffect`/`useTransition` if no longer needed, add `useSWR` from 'swr' and fetcher actions.

**Test Strategy:**

Open/close same lead drawer 5 times rapidly — verify only 1-2 server requests (check Network tab). Verify cached data appears instantly on re-open. Change lead stage in drawer → verify UI updates optimistically. Close and reopen drawer → verify latest data shows. Test error state by simulating network failure. Verify no hydration errors.
