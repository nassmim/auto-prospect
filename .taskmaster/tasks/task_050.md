# Task ID: 50

**Title:** Replace Mock Data with Real Database Queries on Dashboard Page

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** The dashboard page (src/app/(app)/dashboard/page.tsx) uses mockDashboardStats and mockHunts from mock-data.ts. Replace with real data fetching using existing services.

**Details:**

The dashboard imports `mockDashboardStats` and `mockHunts` instead of querying the database:

1. **Dashboard stats**: Create a `getDashboardStats()` function. Relevant services already exist:
   - `getTodayNewLeads()` in `lead.service.ts` — for new leads count
   - `getContactedLeads()` in `lead.service.ts` — for contacted leads count
   - `getLeadsSummaryStats()` in `lead.service.ts` — may already aggregate what's needed
   - Message counts by channel need a service function (check `message.service.ts`)

2. **Active hunts**: `getActiveHunts()` already exists in `hunt.service.ts` at line 271. This returns `THuntSummary[]` which matches the `HuntSummary` type used by the mock.

3. Create `src/services/dashboard.service.ts` (or add to existing services) with:
```typescript
export async function getDashboardStats(): Promise<DashboardStats> {
  const dbClient = await createDrizzleSupabaseClient();
  // Use dbClient.rls() for user-scoped queries
  // Aggregate: today's new leads, contacted leads, messages by channel
}
```

4. Update `dashboard/page.tsx`:
```typescript
export default async function DashboardPage() {
  const [stats, hunts] = await Promise.all([
    getDashboardStats(),
    getActiveHunts(),
  ]);
  return <DashboardView stats={stats} hunts={hunts} />;
}
```

5. Ensure the `DashboardStats` and `HuntSummary` types (currently defined in the commented-out `dashboard.actions.ts` import) are properly exported from the service or a shared types file.

6. Remove the mock data imports from dashboard/page.tsx.

**Test Strategy:**

Load the dashboard page. Verify stats display real data from the database (check against direct DB queries). Verify active hunts list shows real hunts. Test with empty database (no hunts, no leads) to ensure graceful handling of zero states. Verify loading states work correctly.
