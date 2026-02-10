# Task ID: 55

**Title:** Add Proper Loading and Error States Using Next.js Conventions

**Status:** done

**Dependencies:** 50 ✓, 51 ✓, 52 ✓

**Priority:** medium

**Description:** Implement loading.tsx and error.tsx files for key routes to provide proper UX during data fetching and error scenarios, following Next.js App Router conventions.

**Details:**

Now that pages fetch real data server-side, add proper loading and error boundaries:

1. **Loading states** — Create `loading.tsx` files for routes that fetch data:
   - `src/app/(app)/dashboard/loading.tsx` — skeleton for dashboard stats and hunt list
   - `src/app/(app)/hunts/loading.tsx` — skeleton for hunt cards grid
   - `src/app/(app)/leads/loading.tsx` — skeleton for Kanban/List pipeline
   - `src/app/(app)/credits/loading.tsx` — skeleton for credits view
   - `src/app/(app)/hunts/[id]/edit/loading.tsx` — skeleton for edit form

2. **Error states** — Create `error.tsx` files (must be client components):
   - `src/app/(app)/error.tsx` — catch-all error boundary for the app layout
   - Optionally per-route error.tsx for specific error handling

3. **Loading skeleton pattern** using shadcn/ui:
```typescript
// loading.tsx example
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
```

4. **Error boundary pattern**:
```typescript
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

5. Check if a `Skeleton` component exists in `src/components/ui/`. If not, add it via `pnpm dlx shadcn@latest add skeleton`.

**Test Strategy:**

Simulate slow database responses (add artificial delay) to verify loading states appear. Trigger error conditions (e.g., database down, invalid data) to verify error boundaries catch and display properly. Verify the reset button in error boundary re-attempts the data fetch. Test that loading skeletons match the layout of the actual content.
