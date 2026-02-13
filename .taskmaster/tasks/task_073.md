# Task ID: 73

**Title:** Migrate Kanban View to SWR with Polling and Optimistic DnD

**Status:** done

**Dependencies:** 69 ✓, 70 ✓

**Priority:** high

**Description:** Convert the Kanban pipeline view to use SWR with polling for multi-user synchronization while preserving optimistic drag-and-drop updates.

**Details:**

Files: `src/app/(app)/leads/page.tsx`, `src/components/leads/kanban-view.tsx`

Current pattern:
- `page.tsx` fetches `getPipelineLeads()` server-side
- `KanbanView` manages state with `useState(initialLeads)`
- `useTransition` wraps drag-and-drop mutations
- No polling — changes from other users invisible without refresh

Migration steps:
1. Keep server-side fetch in `page.tsx` for initial data.
2. In `KanbanView`, replace `useState(initialLeads)` with SWR:
```typescript
const { data: leads, mutate } = useSWR(
  swrKeys.leads.pipeline,
  () => fetchPipelineLeads(),
  {
    fallbackData: initialLeads,
    refreshInterval: SWR_POLLING.KANBAN, // 30s
    revalidateOnFocus: true,
  }
);
```
3. For drag-and-drop, implement optimistic updates:
```typescript
async function handleDragEnd(result: DropResult) {
  const optimisticLeads = computeNewLeadPositions(leads, result);
  // Optimistic update — instant UI feedback
  await mutate(optimisticLeads, { revalidate: false });
  try {
    await updateLeadStage(leadId, newStage);
    // Revalidate to get server truth
    await mutate();
  } catch {
    // Rollback on failure
    await mutate();
  }
}
```
4. Remove `useState` for leads data — SWR manages the cache.
5. Keep `useTransition` only if needed for isPending UI states during mutations.
6. Ensure polling doesn't disrupt active drag operations — use a `isDragging` ref to conditionally pause polling via `refreshInterval: isDragging ? 0 : SWR_POLLING.KANBAN`.

**Test Strategy:**

Drag a lead between columns → verify instant UI update (optimistic). Check Network tab → verify server action fires. Simulate server error → verify rollback to previous state. Open page in 2 browser tabs → move a lead in tab A → wait 30s → verify tab B shows updated position. Verify drag operations are not interrupted by polling. Test rapid successive drags.
