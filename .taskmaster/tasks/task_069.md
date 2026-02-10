# Task ID: 69

**Title:** Create Server Action Fetcher Wrappers for SWR

**Status:** done

**Dependencies:** 68 ✓

**Priority:** high

**Description:** Create thin 'use server' wrapper functions that expose service-layer read operations as server actions callable from client-side SWR hooks.

**Details:**

Current services (e.g., `lead.service.ts`, `dashboard.service.ts`) are NOT marked with `"use server"` — they cannot be called directly from client components via SWR. Create server action wrappers:

1. Create or update `src/actions/dashboard.actions.ts`:
   - `fetchDashboardStats()` → calls `getDashboardStats()` from service
   - `fetchActiveHunts()` → calls `getActiveHunts()` from service

2. Create or update `src/actions/lead.actions.ts` (add fetcher exports):
   - `fetchLeadDetails(leadId: string)` → calls `getLeadDetails(leadId)` from service
   - `fetchTeamMembers()` → calls `getLeadAssociatedTeamMembers()` from service
   - `fetchPipelineLeads()` → calls `getPipelineLeads()` from service

3. Create or update `src/actions/credit.actions.ts`:
   - `fetchAccountCredits()` → calls `getAccountCredits()` from service

4. Create or update `src/actions/hunt.actions.ts` (add fetcher exports):
   - `fetchAccountHunts()` → calls `getAccountHunts()` from service

Each wrapper: marked `"use server"`, no additional logic beyond delegation, preserves return types via `Awaited<ReturnType<typeof serviceFunction>>`.

IMPORTANT: Keep existing action exports untouched — only ADD new fetcher functions alongside existing mutations.

**Test Strategy:**

Call each new server action from a temporary test component or script. Verify they return the same data shape as the underlying services. Confirm RLS is enforced by checking that unauthenticated calls throw 'Unauthorized'. Verify TypeScript types match between service return types and action return types.
