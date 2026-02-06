# Data Fetching Architecture Migration PRD

## Overview
Migrate high-traffic pages from server-only data fetching to client-side SWR caching and polling to improve real-time data freshness, reduce server load, and provide better UX through automatic revalidation.

## Current State
- 100% server-side data fetching via Next.js server components
- No client-side caching libraries (SWR/TanStack Query)
- Stale data on high-activity pages (Dashboard, Kanban, Credits)
- Lead Drawer refetches same data repeatedly without caching

## Architecture Decisions
- Use SWR with existing server actions (no API routes needed)
- Maintain server-side initial render for SEO
- Centralize cache keys in `src/config/swr-keys.ts` (like `routes.ts`)
- Preserve RLS security model (server actions already enforce RLS)

## Phase 1: Setup and Foundation

### Task: Install and Configure SWR
- Install SWR dependency: `pnpm add swr`
- Create centralized SWR cache keys configuration at `src/config/swr-keys.ts`
- Follow the same pattern as `src/config/routes.ts` for consistency
- Export typed cache key objects for dashboard, leads, hunts, credits, templates
- Use TypeScript `as const` for type safety

## Phase 2: High-Priority Migrations

### Task: Migrate Lead Drawer to SWR with Caching
**Priority:** Highest impact - most frequently used data fetch
**File:** `src/components/leads/lead-drawer.tsx`
**Current Issue:** Re-fetches data every time drawer opens, no caching
**Implementation:**
- Replace `useEffect` + `useTransition` pattern with `useSWR`
- Use server actions (`getLeadDetails`, `getteamMembers`) as SWR fetchers
- Configure deduplication interval: 5000ms
- Enable revalidate on focus
- Add loading and error states
- Test: Open/close same lead drawer 5x, verify only 1-2 server requests

### Task: Add SWR Polling to Dashboard Stats
**Priority:** High - Landing page, stale data during active sessions
**Files:** `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/dashboard-view.tsx`
**Current Issue:** Stats never refresh without full page reload
**Implementation:**
- Keep server-side initial fetch in page.tsx for SEO
- Create new `DashboardView` client component
- Use SWR with `getDashboardStats()` and `getActiveHunts()` server actions
- Set `fallbackData` to initial server-rendered data
- Configure polling: `refreshInterval: 60000` (60 seconds)
- Show "Updated X seconds ago" indicator
- Test: Leave dashboard open 5+ minutes, verify stats update

### Task: Migrate Kanban View to SWR with Polling
**Priority:** High - Multi-user synchronization needed
**Files:** `src/app/(app)/leads/page.tsx`, `src/components/leads/kanban-view.tsx`
**Current Issue:** User A's changes not visible to User B without refresh
**Implementation:**
- Convert `KanbanView` to use SWR with `getPipelineLeads()` server action
- Set `fallbackData` to initial server-rendered leads
- Configure polling: `refreshInterval: 30000` (30 seconds)
- Implement optimistic DnD updates using SWR's `mutate(newData, false)`
- Add error rollback: `mutate()` on server action failure
- Preserve existing drag-and-drop functionality
- Test: 2 users move leads simultaneously, verify sync works

## Phase 3: Medium-Priority Migrations

### Task: Add SWR Polling to Credits Page
**Priority:** Medium - Users need real-time balance updates
**File:** `src/app/(app)/credits/page.tsx`
**Current Issue:** Balance changes not visible as hunts consume credits
**Implementation:**
- Create `CreditsView` client component
- Use SWR with `getAccountCredits()` server action
- Set `fallbackData` to initial server data
- Configure polling: `refreshInterval: 60000` (60 seconds)
- Add visual indicator for balance changes
- Test: Run hunt, verify balance decrements appear

### Task: Migrate Hunt List to SWR with Optimistic Updates
**Priority:** Medium - Faster perceived UX for pause/resume actions
**File:** `src/app/(app)/hunts/page.tsx`
**Current Issue:** Full page reload on status changes
**Implementation:**
- Convert to SWR with `getAccountHunts()` server action
- Implement optimistic updates for pause/resume/delete actions
- Use SWR's `mutate()` for instant UI feedback
- Add rollback on server action errors
- Test: Pause/resume hunt, verify instant UI update

## Phase 4: Server Optimizations

### Task: Parallelize Hunt Edit Page Data Fetching
**Priority:** Low - Simple optimization, small impact
**File:** `src/app/(app)/hunts/[id]/edit/page.tsx:30-35`
**Current Issue:** Sequential awaits for `getHuntById()` and `getAccountTemplates()`
**Implementation:**
- Replace sequential awaits with `Promise.all()`
- Handle `notFound()` error correctly with `.catch()`
- Measure before/after timing
- Test: Verify page load time improvement

## Testing & Validation

### Task: Validate Security Model for All Migrations
**Requirement:** Every client-side migration must preserve RLS and authentication
**Checks:**
- Verify server actions check session before data access
- Confirm `dbClient.rls()` wrapper enforces RLS policies
- Ensure no admin-only data exposed to client
- Validate Zod input validation on all server actions
- Test: Attempt to access another user's data, verify RLS blocks it

### Task: Performance Testing for SWR Migrations
**Metrics to measure:**
- Reduced server request count (verify caching works)
- No infinite loops (dedupingInterval prevents rapid requests)
- Polling intervals appropriate (not too aggressive)
- Bundle size impact (SWR ~5KB gzipped)
- Test: Use Chrome DevTools Network tab and React DevTools

### Task: Documentation Update
**Files to update:**
- Update CLAUDE.md data fetching guidelines to include SWR patterns
- Document SWR cache key usage in `src/config/swr-keys.ts`
- Add examples of server action + SWR integration
- Document when to use server-side vs client-side fetching

## Success Criteria
- Lead Drawer: 80% reduction in duplicate requests
- Dashboard: Stats update every 60 seconds automatically
- Kanban: Multi-user changes sync within 30 seconds
- Credits: Balance updates visible during hunt execution
- All migrations: No security regressions, RLS enforced
- All migrations: Server-side initial render preserved (SEO intact)
- Bundle size increase: <10KB total (SWR is ~5KB)

## Non-Goals (Do Not Migrate)
- Settings page (security-sensitive, rarely changes)
- Templates page (static user content)
- Lead detail page initial load (SEO-critical)
- Server actions for mutations (already optimal)
- Creating API routes for data fetching (use server actions instead)
