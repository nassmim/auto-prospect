# Task ID: 54

**Title:** Remove Mock Data File and All Mock Data References

**Status:** done

**Dependencies:** 50 ✓, 51 ✓

**Priority:** medium

**Description:** After all pages use real data, remove src/lib/mock-data.ts and verify no remaining imports or references to mock data exist anywhere in the codebase.

**Details:**

Clean up all mock data after real data fetching is in place:

1. **Primary file to delete**: `src/lib/mock-data.ts` — contains `mockDashboardStats`, `mockHunts`, `mockaccountHunts`.

2. **Files that import mock data** (must be updated first by tasks 50 and 51):
   - `src/app/(app)/dashboard/page.tsx` — imports `mockDashboardStats`, `mockHunts`
   - `src/app/(app)/hunts/page.tsx` — imports `mockaccountHunts`

3. **Other mock/placeholder references to audit**:
   - `src/services/subscription.service.ts` — `getUserPlan()` returns a hardcoded `1` (line 9). This is a known placeholder but not part of mock-data.ts. Document it but don't change it (subscription system isn't implemented yet).
   - `text-template-form.tsx` has a comment about "Sample data for preview" — check if this is actual mock data or just preview placeholder text for the form.

4. **Cleanup steps**:
   ```bash
   # After tasks 50 and 51 are done:
   # 1. Search for any remaining references
   grep -r 'mock-data' src/
   grep -r 'mockDashboard\|mockHunts\|mockaccount' src/
   # 2. Delete the file
   rm src/lib/mock-data.ts
   # 3. Verify build succeeds
   pnpm build
   ```

5. Also check if `DashboardStats` and `HuntSummary` types were only defined in mock-data.ts — if so, ensure they're properly defined in the service or types file before deletion.

**Test Strategy:**

Run `pnpm build` after deletion to verify no import errors. Search the entire codebase for 'mock' references. Load every page (dashboard, hunts, leads, templates, settings) and verify no errors. Verify TypeScript compilation passes with no type errors related to removed mock types.
