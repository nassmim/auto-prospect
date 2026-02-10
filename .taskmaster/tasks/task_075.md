# Task ID: 75

**Title:** Migrate Hunt List to SWR with Optimistic Updates

**Status:** done

**Dependencies:** 69 ✓, 70 ✓

**Priority:** medium

**Description:** Convert the Hunts list page to use SWR with optimistic updates for instant pause/resume/delete feedback.

**Details:**

Files: `src/app/(app)/hunts/page.tsx`, `src/components/hunts/hunts-view.tsx`

Current pattern:
- `page.tsx` fetches `getAccountHunts()` server-side
- Status changes trigger `revalidatePath()` causing full page data refetch
- Perceived delay between action and UI update

Migration steps:
1. Keep server-side fetch in `page.tsx`.
2. In `HuntsView`, add SWR:
```typescript
const { data: hunts, mutate } = useSWR(
  swrKeys.hunts.list,
  () => fetchAccountHunts(),
  {
    fallbackData: initialHunts,
    revalidateOnFocus: true,
  }
);
```
3. Implement optimistic updates for pause/resume:
```typescript
async function handleStatusChange(huntId: string, newStatus: string) {
  const optimisticHunts = hunts.map(h =>
    h.id === huntId ? { ...h, status: newStatus } : h
  );
  await mutate(optimisticHunts, { revalidate: false });
  try {
    await updateHuntStatus(huntId, newStatus);
    await mutate(); // Revalidate
  } catch {
    await mutate(); // Rollback
  }
}
```
4. For delete: optimistically remove from list, rollback on failure.
5. No polling needed — hunts list doesn't change frequently enough to justify it.

**Test Strategy:**

Click pause on a hunt → verify instant UI update (no loading delay). Verify server action fires in Network tab. Simulate server error → verify hunt status rolls back. Delete a hunt → verify instant removal from list. Verify initial server-rendered data shows without loading state.
