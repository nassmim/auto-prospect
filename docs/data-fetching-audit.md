# Data Fetching Architecture Audit & Recommendations

**Project:** Auto-Prospect
**Date:** 2026-02-02
**Audit Scope:** All data fetching patterns in the Next.js 16 App Router application

---

## Executive Summary

The Auto-Prospect codebase currently uses **100% server-side data fetching** via Next.js server components and server actions. This architecture is secure, SEO-friendly, and leverages RLS (Row-Level Security) effectively. However, several high-traffic user interactions would benefit from client-side data fetching with SWR to improve real-time data freshness, reduce server load, and provide better UX through caching and automatic revalidation.

**Key Findings:**
- ✅ **Strong foundation**: All initial page loads use server-side fetching (correct for SEO + RLS)
- ✅ **Security-first**: RLS enforcement is consistent across all data access patterns
- ⚠️ **Stale data risk**: High-activity pages (Dashboard, Kanban) never refresh without full page reload
- ⚠️ **Missing caching**: Lead Drawer fetches same data repeatedly without deduplication
- ⚠️ **Inefficient parallelization**: Hunt Edit page uses sequential `await` instead of `Promise.all()`

**Architecture Status:**
- **SWR/TanStack Query installed:** ❌ No (neither dependency exists in `package.json`)
- **API routes for client fetching:** ❌ No (only 2 API routes exist, both for webhooks/cron)
- **Client-side data patterns:** Limited to `useTransition()` with server actions (no caching)

---

## Pattern Inventory

### Server Component Pages (9 files)

| Page | Data Fetched | Current Pattern | Data Freshness Need | Recommendation |
|------|-------------|-----------------|-------------------|----------------|
| `dashboard/page.tsx` | Dashboard stats + active hunts | `Promise.all()` server fetch | **HIGH** - Stats become stale during session | **Migrate to SWR polling** |
| `leads/page.tsx` | Pipeline leads | Single `await` | **HIGH** - Multi-user updates not reflected | **Migrate to SWR polling** |
| `leads/[id]/page.tsx` | Lead details + messages + activities | `Promise.all()` server fetch | **MEDIUM** - SEO-critical, but could poll for updates | **Keep server-side** (SEO priority) |
| `hunts/page.tsx` | Account hunts | Single `await` | **MEDIUM** - Status changes need updates | **Consider SWR for optimistic updates** |
| `hunts/new/page.tsx` | Templates | Single `await` | **LOW** - Static user content | **Keep server-side** ✅ |
| `hunts/[id]/edit/page.tsx` | Hunt + templates | Two sequential `await` | **LOW** - Static, but inefficient | **Parallelize with `Promise.all()`** 🔧 |
| `templates/page.tsx` | Templates | Single `await` | **LOW** - Static user content | **Keep server-side** ✅ |
| `settings/page.tsx` | Org + members + invitations | `Promise.all()` server fetch | **LOW** - Security-sensitive | **Keep server-side** ✅ |
| `credits/page.tsx` | Credit balance | Single `await` | **MEDIUM** - Balance changes during hunts | **Add SWR polling** |

### Client Components with Data Fetching (6 files)

| Component | Data Fetched | Current Pattern | Issue | Recommendation |
|-----------|-------------|-----------------|-------|----------------|
| `kanban-view.tsx` | None (receives props) | Local state only | Stale data in multi-user scenarios | **Migrate parent to SWR polling** |
| `lead-drawer.tsx` | Lead details + team members | `useTransition()` + server actions | **No caching** - re-fetches on every open | **Migrate to SWR** (HIGH impact) |
| `list-view.tsx` | None (receives props) | Local state + bulk mutations | WIP component | **No change needed** ✅ |
| `messages-tab.tsx` | None (receives props) | Mutations only | N/A | **No change needed** ✅ |
| `filters-tab.tsx` | None (receives props) | Mutations only | N/A | **No change needed** ✅ |
| `team-tab.tsx` | None (receives props) | Mutations only | N/A | **No change needed** ✅ |

### Services Layer (14 files)

All service functions use Drizzle ORM with RLS enforcement (`dbClient.rls()`) or admin mode (`dbClient.admin`). Services are correctly server-side only and should **remain unchanged**.

### API Routes (2 files)

- `api/hunt/route.ts` - Cron trigger (not a data endpoint)
- `api/webhooks/lobstr/get-ads/route.ts` - External webhook (not a data endpoint)

**No client-facing API routes exist**. Recommendations below require creating new API routes.

---

## Priority 1 Recommendations (High Impact)

### 1. Lead Drawer: Migrate to SWR for Caching + Deduplication

**File:** `src/components/leads/lead-drawer.tsx`

**Current Behavior:**
```typescript
useEffect(() => {
  startTransition(async () => {
    const [data, members] = await Promise.all([
      getLeadDetails(leadId),
      getteamMembers(leadId),
    ]);
    setLead(data);
  });
}, [leadId]);
```

**Problem:**
- Every time a user opens the same lead drawer, it re-fetches data
- No caching, no deduplication
- Users frequently open/close drawers while browsing Kanban
- Wastes server resources and causes loading flicker

**Recommendation:**
Migrate to SWR with automatic caching:

```typescript
// New API route: src/app/api/leads/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const dbClient = await createDrizzleSupabaseClient();
  const [lead, members] = await Promise.all([
    dbClient.rls((tx) => tx.query.leads.findFirst({ where: eq(leads.id, params.id) })),
    getteamMembers(params.id)
  ]);

  return Response.json({ lead, members });
}

// Component update:
import useSWR from 'swr';

const { data, error } = useSWR(
  leadId ? `/api/leads/${leadId}` : null,
  fetcher,
  { revalidateOnFocus: true, dedupingInterval: 5000 }
);
```

**Impact:**
- ✅ Opening the same lead 3x = 1 network request instead of 3
- ✅ Automatic background revalidation
- ✅ Faster perceived performance (instant cache hits)
- ✅ Reduced server load

**Effort:** Medium (1 API route + component refactor)

---

### 2. Dashboard Stats: Add SWR Polling for Live Updates

**File:** `src/app/(app)/dashboard/page.tsx` + `src/components/dashboard/dashboard-view.tsx`

**Current Behavior:**
```typescript
// page.tsx
const [stats, hunts] = await Promise.all([
  getDashboardStats(),
  getActiveHunts(),
]);
return <DashboardView stats={stats} hunts={hunts} />;
```

**Problem:**
- Dashboard shows "Today's new leads", "Contacted today", "Active hunts"
- Data becomes stale if user keeps dashboard open for >10 minutes
- During active prospecting, stats change frequently
- No way to see updates without manual page refresh

**Recommendation:**
Keep server-side initial fetch (SEO), add client-side polling:

```typescript
// New API route: src/app/api/dashboard/stats/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getDashboardStats();
  const hunts = await getActiveHunts();

  return Response.json({ stats, hunts });
}

// Component update:
'use client';
import useSWR from 'swr';

export function DashboardView({ initialStats, initialHunts }) {
  const { data } = useSWR('/api/dashboard/stats', fetcher, {
    fallbackData: { stats: initialStats, hunts: initialHunts },
    refreshInterval: 60000, // Poll every 60 seconds
  });

  return (
    // Render with data.stats, data.hunts
  );
}
```

**Impact:**
- ✅ Live stats updates every 60s
- ✅ Users see new leads arrive in real-time
- ✅ Better engagement (users stay on dashboard longer)
- ✅ Still SEO-friendly (server-rendered initial HTML)

**Effort:** Medium (1 API route + component refactor)

---

### 3. Kanban View: Add SWR for Multi-User Freshness

**File:** `src/app/(app)/leads/page.tsx` + `src/components/leads/kanban-view.tsx`

**Current Behavior:**
```typescript
// page.tsx
const leads = await getPipelineLeads();
return <LeadsPageClient leads={leads} />;

// kanban-view.tsx
const [leads, setLeads] = useState(initialLeads);
// Local DnD optimistic updates only
```

**Problem:**
- If User A moves a lead, User B doesn't see the update
- New leads arriving during session aren't shown
- Multi-user teams need real-time synchronization
- Optimistic updates work, but no revalidation from server

**Recommendation:**
Convert to SWR with polling + optimistic updates:

```typescript
// New API route: src/app/api/leads/pipeline/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leads = await getPipelineLeads();
  return Response.json({ leads });
}

// Component update:
import useSWR from 'swr';

const { data, mutate } = useSWR('/api/leads/pipeline', fetcher, {
  fallbackData: { leads: initialLeads },
  refreshInterval: 30000, // Poll every 30s
});

const handleDragEnd = async (event) => {
  // Optimistic update
  mutate({ leads: updatedLeads }, false);

  // Server mutation
  await updateLeadStage(leadId, newStage);

  // Revalidate from server
  mutate();
};
```

**Impact:**
- ✅ Multi-user teams see each other's updates
- ✅ New leads appear automatically
- ✅ Optimistic DnD still works
- ✅ Automatic rollback on server errors

**Effort:** High (1 API route + complex component refactor with DnD state)

---

## Priority 2 Recommendations (Medium Impact)

### 4. Credits Page: Add SWR Polling for Balance Updates

**File:** `src/app/(app)/credits/page.tsx`

**Problem:**
- Credit balance decreases as hunts run in background
- Users don't see balance changes without refresh
- Critical for users to know when they're running low

**Recommendation:**
Similar to Dashboard - server-side initial, client-side polling:

```typescript
// API route: src/app/api/credits/route.ts
const { data } = useSWR('/api/credits', fetcher, {
  fallbackData: { credits: initialCredits },
  refreshInterval: 60000,
});
```

**Impact:** ✅ Users see real-time credit deductions
**Effort:** Low (1 API route + simple component refactor)

---

### 5. Hunt List: Consider SWR for Optimistic Status Updates

**File:** `src/app/(app)/hunts/page.tsx`

**Current:** Server actions with `revalidatePath()`
**Recommendation:** SWR with optimistic updates for pause/resume actions

**Impact:** ✅ Faster perceived UX (no full page reload)
**Effort:** Medium

---

### 6. Hunt Edit Page: Parallelize Server Fetches

**File:** `src/app/(app)/hunts/[id]/edit/page.tsx:30-35`

**Problem:**
```typescript
let hunt;
try {
  hunt = await getHuntById(id);
} catch (error) {
  notFound();
}
const templates = await getAccountTemplates(); // ⚠️ Sequential!
```

**Recommendation:**
```typescript
const [hunt, templates] = await Promise.all([
  getHuntById(id).catch(() => notFound()),
  getAccountTemplates(),
]);
```

**Impact:** ✅ Faster page load (parallel fetching)
**Effort:** Trivial (5-minute fix)

---

## Priority 3 (No Change Needed)

### Templates Page
**Reason:** Static user-created content, infrequent changes
**Decision:** ✅ Keep server-side

### Settings Page
**Reason:** Security-sensitive data (org, members, invitations)
**Decision:** ✅ Keep server-side (RLS critical)

### Lead Detail Page
**Reason:** SEO-critical (individual lead pages), dynamic OG images
**Decision:** ✅ Keep server-side (could add polling for messages/activities later)

---

## Architecture Decisions

### SWR vs TanStack Query

**Recommendation:** Use **SWR** (per CLAUDE.md guidelines)

**Rationale:**
- Simpler API for this use case (no complex dependent queries)
- Smaller bundle size
- Built-in focus tracking and interval refetching
- Better for real-time polling scenarios

**Use TanStack Query if:**
- Infinite scrolling needed (pagination)
- Complex dependent query chains emerge
- Advanced cache invalidation patterns required

### API Route Strategy

**Pattern for all client-fetched endpoints:**

```typescript
// src/app/api/[resource]/route.ts
export async function GET(req: Request) {
  // 1. Auth check (Supabase session)
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use existing service with RLS
  const dbClient = await createDrizzleSupabaseClient();
  const data = await dbClient.rls((tx) => {
    // RLS automatically enforces user's account access
    return getServiceData(tx);
  });

  // 3. Return JSON
  return Response.json({ data });
}
```

**Key Points:**
- ✅ Reuse existing service functions (no duplication)
- ✅ RLS enforcement via `dbClient.rls()` wrapper
- ✅ Authentication via Supabase session (same as server actions)
- ✅ No admin access in client-facing routes

### Security Model Validation

**For every client-side migration, verify:**

| Security Check | Implementation |
|---------------|----------------|
| Authentication | `createClient().auth.getSession()` |
| Authorization | `dbClient.rls()` wrapper enforces RLS policies |
| Data access | Service functions already use RLS |
| Admin operations | Never exposed to client (use `dbClient.admin` only in server actions/cron) |
| Input validation | Zod schemas on API route inputs |

**Example (Lead Drawer API route):**
```typescript
// ✅ GOOD: RLS enforced, user can only access their account's leads
const lead = await dbClient.rls((tx) =>
  tx.query.leads.findFirst({ where: eq(leads.id, params.id) })
);

// ❌ BAD: Bypasses RLS, user could access any account's leads
const lead = await dbClient.admin.query.leads.findFirst({ where: eq(leads.id, params.id) });
```

---

## Implementation Roadmap

### Phase 1: Setup (Week 1)

**Step 1:** Install SWR
```bash
pnpm add swr
```

**Step 2:** Create SWR provider and fetcher utility
```typescript
// src/lib/swr.ts
export const fetcher = (url: string) => fetch(url).then(r => r.json());
```

**Step 3:** Create first API route (Lead Drawer)
- Lowest risk, highest impact
- Small component, no complex state interactions

---

### Phase 2: High-Priority Migrations (Week 2-3)

**Order of implementation:**

1. **Lead Drawer** (Priority 1.1)
   - Risk: Low (isolated component)
   - Impact: High (most frequently used data fetch)
   - Test: Open/close drawer 5x, verify only 1-2 requests

2. **Dashboard Stats** (Priority 1.2)
   - Risk: Low (read-only polling)
   - Impact: High (landing page engagement)
   - Test: Leave dashboard open 5 minutes, verify stats update

3. **Credits Page** (Priority 2.1)
   - Risk: Low (simple polling)
   - Impact: Medium (user awareness)
   - Test: Run hunt, verify balance updates

---

### Phase 3: Complex Migrations (Week 4-5)

4. **Kanban View** (Priority 1.3)
   - Risk: Medium (complex DnD state + SWR mutations)
   - Impact: High (multi-user sync)
   - Test: 2 users move same lead, verify conflict resolution

5. **Hunt List** (Priority 2.2)
   - Risk: Low (optimistic updates similar to Kanban)
   - Impact: Medium (faster UX)

---

### Phase 4: Server Optimizations (Week 6)

6. **Hunt Edit Parallelization** (Priority 2.3)
   - Risk: None (pure optimization)
   - Impact: Small (faster page load)
   - Test: Measure `getHuntById` + `getAccountTemplates` timing

---

## Validation Checklist

For each migration, verify:

### Functionality
- [ ] Initial server render works (SEO preserved)
- [ ] Client-side revalidation triggers correctly
- [ ] Loading states display appropriately
- [ ] Error states handle network failures

### Security
- [ ] API route checks `session` before data access
- [ ] RLS policies apply via `dbClient.rls()`
- [ ] No admin-only data exposed to client
- [ ] Input validation with Zod on POST/PUT routes

### Performance
- [ ] Reduced server requests (caching works)
- [ ] No infinite loops (SWR dedupingInterval set)
- [ ] Polling interval appropriate (not too aggressive)
- [ ] Bundle size acceptable (SWR ~5KB gzipped)

### Architecture
- [ ] Follows CLAUDE.md decision matrix
- [ ] Uses `src/config/routes.ts` for URLs
- [ ] Zod validation on inputs
- [ ] Service functions reused (no duplication)

---

## False Positive Prevention

### Do NOT migrate:

❌ **Settings page** - Security-sensitive, rarely changes
❌ **Templates page** - Static content, user-created
❌ **Lead detail page (initial load)** - SEO-critical
❌ **Server actions (mutations)** - Already use optimistic updates correctly

### Do NOT create API routes for:

❌ Mutations that use server actions (already optimal)
❌ Cron jobs (use server-side admin access)
❌ Webhooks (external triggers, not user-facing)

---

## Appendix: Full File List Analyzed

### Server Component Pages (9)
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/leads/page.tsx`
- `src/app/(app)/leads/[id]/page.tsx`
- `src/app/(app)/hunts/page.tsx`
- `src/app/(app)/hunts/new/page.tsx`
- `src/app/(app)/hunts/[id]/edit/page.tsx`
- `src/app/(app)/templates/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/app/(app)/credits/page.tsx`

### Client Components (6)
- `src/components/leads/kanban-view.tsx`
- `src/components/leads/lead-drawer.tsx`
- `src/components/leads/list-view.tsx`
- `src/components/settings/messages-tab.tsx`
- `src/components/settings/filters-tab.tsx`
- `src/components/settings/team-tab.tsx`

### Services (14)
- `src/services/dashboard.service.ts`
- `src/services/lead.service.ts`
- `src/services/hunt.service.ts`
- `src/services/message.service.ts`
- `src/services/credit.service.ts`
- `src/services/team.service.ts`
- `src/services/account.service.ts`
- `src/services/ad.service.ts`
- `src/services/channel.service.ts`
- `src/services/lobstr.service.ts`
- `src/services/subscription.service.ts`
- `src/services/channel-allocator.service.ts`
- `src/services/daily-contact-tracker.service.ts`
- `src/services/general.service.ts`

### API Routes (2)
- `src/app/api/hunt/route.ts` (cron)
- `src/app/api/webhooks/lobstr/get-ads/route.ts` (webhook)

---

## Conclusion

The current architecture is **solid and secure**. The recommended migrations are **incremental improvements** for:
1. **Real-time data freshness** (Dashboard, Kanban, Credits)
2. **Reduced server load** (Lead Drawer caching)
3. **Better multi-user UX** (Kanban sync)

**No breaking changes required.** All migrations can be done incrementally with backward compatibility.

**Estimated total effort:** 3-4 weeks (1 developer)
**Estimated ROI:** High (improved UX, reduced server costs, better multi-user support)
