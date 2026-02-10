# Task ID: 67

**Title:** Audit Data Fetching Patterns and Recommend Server vs Client Strategy

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Audit all data fetching patterns across the codebase to determine optimal server-side vs client-side fetching strategy. Produce a prioritized report covering server components that would benefit from client-side fetching, client patterns that should be server-side, and opportunities for SWR/TanStack Query adoption.

**Details:**

## Current State Analysis

The codebase currently uses **100% server-side data fetching** via Next.js 16 App Router server components and server actions. There are no SWR or TanStack Query dependencies installed. All pages are dynamic server components that fetch data via Drizzle ORM services with RLS enforcement.

## Audit Scope and Files to Examine

### Phase 1: Catalog All Data Fetching Points

**Server Component Pages (all in `src/app/(app)/`):**
- `dashboard/page.tsx` — Fetches `getDashboardStats()` + `getActiveHunts()` via `Promise.all()`
- `leads/page.tsx` — Fetches `getPipelineLeads()` (single await)
- `leads/[id]/page.tsx` — Fetches `getLeadDetails()`, `getLeadMessages()`, `getLeadActivities()` via `Promise.all()`
- `hunts/page.tsx` — Fetches `getAccountHunts()` (single await)
- `hunts/new/page.tsx` — Fetches `getAccountTemplates()` (single await)
- `hunts/[id]/edit/page.tsx` — Fetches `getHuntById()` + `getAccountTemplates()` (separate awaits — should be parallelized)
- `templates/page.tsx` — Fetches `getAccountTemplates()` (single await)
- `settings/page.tsx` — Fetches `getCurrentaccount()`, `getteamMembers()`, `getaccountInvitations()` via `Promise.all()`
- `credits/page.tsx` — Fetches `getAccountCredits()` (single await)

**Client Components with Server Action Calls:**
- `src/components/leads/kanban-view.tsx` — Calls `updateLeadStage()` server action on drag-drop (mutation only)
- `src/components/leads/lead-drawer.tsx` — Calls `getLeadDetails()`, `getteamMembers()`, `getDefaultWhatsAppTemplate()` on-demand via `useTransition()` (data fetching from client)
- `src/components/settings/messages-tab.tsx` — Uses `useTransition()` for mutations
- `src/components/settings/filters-tab.tsx` — Uses `useTransition()` for mutations
- `src/components/settings/team-tab.tsx` — Uses `useTransition()` for mutations
- `src/components/leads/list-view.tsx` — Uses `useTransition()` (WIP component)

**Services (`src/services/`):**
- 14 service files with 29+ functions providing data to server components and actions
- All use Drizzle RLS (`dbClient.rls()`) for user context or `dbClient.admin` for system operations

**API Routes (`src/app/api/`):**
- `api/hunt/route.ts` — Cron trigger for daily hunts (not a data endpoint)
- `api/webhooks/lobstr/get-ads/route.ts` — External webhook handler (not a data endpoint)

### Phase 2: Evaluate Each Pattern Against Decision Matrix

For each data fetching point, evaluate using these criteria:

**Should be SERVER-SIDE (current default) when:**
- Initial page load data (SEO-critical or first-paint)
- Static or infrequently changing data
- Data requiring secure RLS enforcement
- Large datasets (better server performance)

**Should be CLIENT-SIDE (SWR/TanStack Query) when:**
- Frequently updating data (real-time feeds, live status, polling)
- Data needed by multiple deeply nested client components (avoiding prop drilling)
- User-specific filters/sorts without full page reload
- Data that changes based on client-side interactions

### Phase 3: Specific Areas to Investigate

#### 3a. Dashboard Stats — Candidate for Client-Side Polling
- **File:** `src/app/(app)/dashboard/page.tsx` + `src/components/dashboard/dashboard-view.tsx`
- **Current:** Server-fetched on page load only
- **Question:** Dashboard stats (today's new leads, contacted leads, active hunts) could become stale during a session. Evaluate if SWR with `refreshInterval` would provide better UX for live stats updates.
- **Impact:** HIGH — Dashboard is the most-viewed page

#### 3b. Lead Drawer On-Demand Fetching — Strong Candidate for SWR
- **File:** `src/components/leads/lead-drawer.tsx`
- **Current:** Uses `useTransition()` to call server actions (`getLeadDetails()`, `getteamMembers()`) when drawer opens
- **Question:** This is already client-side data fetching but without caching. SWR would add automatic caching (opening the same lead twice wouldn't re-fetch), deduplication, and stale-while-revalidate behavior.
- **Impact:** HIGH — Leads Kanban is the primary working view

#### 3c. Kanban View Data Freshness
- **File:** `src/components/leads/kanban-view.tsx`
- **Current:** Receives `initialLeads` as props from server, manages local state for DnD
- **Question:** If another team member moves a lead or new leads arrive during the session, the Kanban becomes stale. Evaluate SWR with polling for keeping the Kanban view fresh.
- **Impact:** MEDIUM-HIGH — Multi-user scenarios need real-time data

#### 3d. Hunts List — Potential for Optimistic Updates
- **File:** `src/app/(app)/hunts/page.tsx`
- **Current:** Server-fetched, uses `revalidatePath()` after mutations
- **Question:** Hunt status changes (active → paused) could benefit from optimistic updates with SWR `mutate()` instead of full page revalidation
- **Impact:** MEDIUM

#### 3e. Credits Balance — Real-Time Updates
- **File:** `src/app/(app)/credits/page.tsx`
- **Current:** Server-fetched on page load
- **Question:** Credit balance changes as hunts run in the background. Should this poll for updates?
- **Impact:** MEDIUM — Important for user awareness of remaining credits

#### 3f. Templates List — Keep Server-Side
- **File:** `src/app/(app)/templates/page.tsx`
- **Current:** Server-fetched
- **Assessment:** Templates are relatively static, user-created content. Server-side is correct. No change needed.

#### 3g. Settings Page — Keep Server-Side
- **File:** `src/app/(app)/settings/page.tsx`
- **Current:** Server-fetched with `Promise.all()` for 3 data sources
- **Assessment:** Settings are rarely changing, security-sensitive data. Server-side is correct. No change needed.

#### 3h. Hunt Edit Page — Parallelization Fix
- **File:** `src/app/(app)/hunts/[id]/edit/page.tsx`
- **Current:** Two separate `await` calls that could be parallelized with `Promise.all()`
- **Assessment:** Not a server→client migration, but a server-side optimization opportunity

### Phase 4: Generate Recommendations Report

Create `docs/data-fetching-audit.md` with:

1. **Executive Summary** — Overall architecture assessment and key findings
2. **Pattern Inventory Table** — Every data fetch point with current/recommended pattern
3. **Priority 1 Recommendations (High Impact):**
   - Dashboard stats: Add SWR polling for live updates
   - Lead Drawer: Migrate to SWR for caching + deduplication
   - Kanban View: Add SWR for multi-user freshness
4. **Priority 2 Recommendations (Medium Impact):**
   - Credits page: Add SWR polling for balance updates
   - Hunt list: Consider SWR for optimistic updates
   - Hunt edit page: Parallelize server fetches with `Promise.all()`
5. **Priority 3 (No Change Needed):**
   - Templates page: Keep server-side (static content)
   - Settings page: Keep server-side (security-sensitive)
   - Lead detail page: Keep server-side (SEO, initial load)
6. **Implementation Roadmap:**
   - Step 1: Install SWR (`pnpm add swr`)
   - Step 2: Create SWR provider and API routes for client-fetched data
   - Step 3: Migrate Lead Drawer to SWR (highest impact, lowest risk)
   - Step 4: Add Dashboard polling
   - Step 5: Evaluate Kanban freshness needs based on multi-user usage patterns
7. **Architecture Decisions:**
   - SWR vs TanStack Query recommendation (SWR preferred per CLAUDE.md unless complex state needed)
   - API route strategy for client-side data endpoints
   - RLS enforcement considerations for client-fetched data (API routes still use server-side Drizzle with RLS)

### Phase 5: Validate Recommendations

- Verify each recommendation aligns with `CLAUDE.md` data fetching decision matrix
- Ensure security model (RLS) is maintained for any client-side migration
- Confirm no SEO-critical data is moved to client-side fetching
- Check that proposed API routes would correctly enforce authentication

**Test Strategy:**

1. **Report Completeness:** Verify the audit report covers every data fetching point listed in Phase 1 (all 9 page files, all 6 client components with server action calls, all 14 service files).

2. **Pattern Classification Accuracy:** For each data fetch point, verify the server-vs-client recommendation is justified against the decision matrix in CLAUDE.md (SEO needs, update frequency, security requirements, prop drilling depth).

3. **Priority Validation:** Confirm priority rankings by checking: (a) Dashboard and Kanban are the most-visited pages (high user impact), (b) Lead Drawer fetching pattern is already effectively client-side but lacks caching (easy win), (c) Templates and Settings are correctly classified as no-change-needed.

4. **Security Review:** For each recommended client-side migration, verify the proposal includes: (a) API route creation that uses server-side Drizzle with RLS enforcement, (b) Authentication check before data access, (c) No exposure of admin-only data to client.

5. **Architecture Consistency:** Verify recommendations align with existing patterns: (a) SWR preferred over TanStack Query (per CLAUDE.md), (b) Zod validation on API route inputs, (c) Route configuration uses `src/config/routes.ts`.

6. **Parallelization Check:** Verify the hunt edit page (`hunts/[id]/edit/page.tsx`) optimization is flagged — two independent `await` calls should use `Promise.all()`.

7. **No False Positives:** Confirm the report does not recommend client-side fetching for: (a) Settings data (security-sensitive), (b) Initial page load data needed for SEO, (c) Server actions that are mutation-only (not data fetching).
