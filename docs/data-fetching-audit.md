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
- **Client-side data patterns:** Limited to `useTransition()` with server actions (no caching)

**Recommended Approach:**
- **Use SWR with existing server actions** (no API routes needed)
- Server actions work perfectly as SWR fetchers via cache keys
- Maintains codebase consistency and security model

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

**No client-facing API routes exist**, and none are needed. SWR works directly with server actions via cache keys.

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
Migrate to SWR with server actions (no API routes needed):

```typescript
// Component update:
'use client';
import useSWR from 'swr';
import { getLeadDetails, getteamMembers } from '@/actions/lead.actions';
import { swrKeys } from '@/config/swr-keys';

export function LeadDrawer({ leadId, onClose }) {
  const { data, error, isLoading } = useSWR(
    leadId ? swrKeys.leads.drawer(leadId) : null,
    async () => {
      const [lead, members] = await Promise.all([
        getLeadDetails(leadId),
        getteamMembers(leadId),
      ]);
      return { lead, members };
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  // Use data.lead, data.members
}
```

**Why this works:**
- SWR caches based on the key `['lead-drawer', leadId]`, not the URL
- Multiple components using same key share cache (deduplication)
- Server actions enforce RLS just like they do for mutations
- No API routes = less code, same security model

**Impact:**
- ✅ Opening the same lead 3x = 1 server action call instead of 3
- ✅ Automatic background revalidation
- ✅ Faster perceived performance (instant cache hits)
- ✅ Reduced server load
- ✅ Maintains codebase consistency (reuses existing server actions)

**Effort:** Low (component refactor only, no new routes)

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
Keep server-side initial fetch (SEO), add client-side polling with server actions:

```typescript
// Component update:
'use client';
import useSWR from 'swr';
import { getDashboardStats } from '@/services/dashboard.service';
import { getActiveHunts } from '@/services/hunt.service';
import { swrKeys } from '@/config/swr-keys';

export function DashboardView({ initialStats, initialHunts }) {
  const { data } = useSWR(
    swrKeys.dashboard.stats,
    async () => {
      const [stats, hunts] = await Promise.all([
        getDashboardStats(),
        getActiveHunts(),
      ]);
      return { stats, hunts };
    },
    {
      fallbackData: { stats: initialStats, hunts: initialHunts },
      refreshInterval: 60000, // Poll every 60 seconds
    }
  );

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
- ✅ Reuses existing service functions

**Effort:** Low (component refactor only)

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
Convert to SWR with polling + optimistic updates using server actions:

```typescript
// Component update:
'use client';
import useSWR from 'swr';
import { getPipelineLeads } from '@/services/lead.service';
import { updateLeadStage } from '@/actions/lead.actions';
import { swrKeys } from '@/config/swr-keys';

export function KanbanView({ initialLeads }) {
  const { data, mutate } = useSWR(
    swrKeys.leads.pipeline,
    () => getPipelineLeads(),
    {
      fallbackData: initialLeads,
      refreshInterval: 30000, // Poll every 30s
    }
  );

  const handleDragEnd = async (event) => {
    const { leadId, newStage } = extractDragData(event);

    // Optimistic update
    const updatedLeads = data.map(lead =>
      lead.id === leadId ? { ...lead, stage: newStage } : lead
    );
    mutate(updatedLeads, false);

    // Server mutation (server action)
    try {
      await updateLeadStage(leadId, newStage);
      // Revalidate from server
      mutate();
    } catch (error) {
      // Rollback on error
      mutate();
    }
  };
}
```

**Impact:**
- ✅ Multi-user teams see each other's updates
- ✅ New leads appear automatically
- ✅ Optimistic DnD still works
- ✅ Automatic rollback on server errors
- ✅ Reuses existing server actions

**Effort:** Medium (component refactor with DnD state, no new routes)

---

## Priority 2 Recommendations (Medium Impact)

### 4. Credits Page: Add SWR Polling for Balance Updates

**File:** `src/app/(app)/credits/page.tsx`

**Problem:**
- Credit balance decreases as hunts run in background
- Users don't see balance changes without refresh
- Critical for users to know when they're running low

**Recommendation:**
Similar to Dashboard - server-side initial, client-side polling with server actions:

```typescript
// Component update:
'use client';
import useSWR from 'swr';
import { getAccountCredits } from '@/services/credit.service';
import { swrKeys } from '@/config/swr-keys';

export function CreditsView({ initialCredits }) {
  const { data } = useSWR(
    swrKeys.credits.balance,
    () => getAccountCredits(),
    {
      fallbackData: initialCredits,
      refreshInterval: 60000,
    }
  );

  // Render with data
}
```

**Impact:** ✅ Users see real-time credit deductions
**Effort:** Low (simple component refactor)

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

### Why Server Actions Work with SWR (Corrected Understanding)

**Initial misconception:** SWR requires HTTP endpoints (URLs) for caching and deduplication.

**Reality:** SWR works with **any serializable cache key** and **any async function**.

**How it works:**
1. **Cache keys are flexible** - Can be strings, arrays, objects, or any serializable value
   - Example: `useSWR(swrKeys.dashboard.stats, fetcherFn)`
   - Example: `useSWR(swrKeys.leads.drawer(leadId), fetcherFn)`
   - **IMPORTANT:** Never hardcode keys - use centralized `swrKeys` config

2. **Deduplication is key-based** - Multiple components using the same key share cached data
   - When Component A and Component B both use `['lead', '123']`, only one fetch occurs
   - [Source: SWR deduplication docs](https://dev.to/andykao1213/how-to-understand-the-request-deduplication-in-swr-28bb)

3. **Fetcher can be any async function** - Not limited to `fetch()`
   - Works with server actions: `() => getLeadDetails(id)`
   - Works with services: `() => getPipelineLeads()`
   - Works with GraphQL, Firebase, or any data source

**Benefits of server actions over API routes:**
- ✅ **Consistency** - Same pattern as mutations (server actions throughout)
- ✅ **Less code** - No API route boilerplate
- ✅ **Same security model** - RLS already enforced in server actions
- ✅ **Type safety** - Direct TypeScript imports, no fetch typing
- ✅ **Easier refactoring** - Change service signature, TypeScript errors guide you

**Tradeoffs vs API routes:**
- ❌ **No HTTP caching** - Server actions use POST (no browser/CDN cache)
- ❌ **No network tab visibility** - Harder to debug in DevTools
- ❌ **No external access** - Can't be called from outside the app

**Recommendation for this project:**
Use **server actions with SWR** because:
- Data is user-specific (no CDN benefit anyway)
- Not a public API (no external access needed)
- Consistency > minor debugging convenience

**Sources:**
- [SWR with server actions - Next.js Forum](https://nextjs-forum.com/post/1237619082174660608)
- [SWR cache key flexibility](https://swr.vercel.app/docs/advanced/cache)
- [Request deduplication explained](https://dev.to/andykao1213/how-to-understand-the-request-deduplication-in-swr-28bb)
- [TanStack Query + Server Actions guide](https://reetesh.in/blog/server-action-with-tanstack-query-in-next.js-explained)

---

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

### Server Actions with SWR Strategy

**Pattern for all SWR-cached data fetching:**

```typescript
// In client component:
'use client';
import useSWR from 'swr';
import { getResourceData } from '@/services/resource.service';
import { swrKeys } from '@/config/swr-keys';
// OR import { getResourceData } from '@/actions/resource.actions';

export function Component({ initialData }) {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.resource.key, // NEVER hardcode - use swrKeys config
    () => getResourceData(),
    {
      fallbackData: initialData, // SSR data from server component
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      // Add refreshInterval for polling if needed
    }
  );

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <UI data={data} />;
}
```

**Key Points:**
- ✅ Reuse existing server actions/services (no new routes)
- ✅ RLS enforcement preserved (server actions already use RLS)
- ✅ Authentication via Supabase session (same as mutations)
- ✅ Codebase consistency (same pattern as mutations)
- ✅ Cache keys centralized in `swrKeys` config (like `routes.ts`)
- ✅ TypeScript autocomplete for all cache keys

### Security Model Validation

**For every client-side migration, verify:**

| Security Check | Implementation |
|---------------|----------------|
| Authentication | Server actions already check session via `createClient()` |
| Authorization | `dbClient.rls()` wrapper enforces RLS policies (already in services) |
| Data access | Service functions/server actions already use RLS |
| Admin operations | Never exposed to client (use `dbClient.admin` only in cron jobs) |
| Input validation | Zod schemas already in server actions |

**Security is preserved because:**
- Server actions run server-side (not exposed to client)
- RLS policies are enforced in service layer
- Authentication is checked in server actions
- No changes to security model needed

**Example (existing server action):**
```typescript
// src/actions/lead.actions.ts
export async function getLeadDetails(leadId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const dbClient = await createDrizzleSupabaseClient();

  // ✅ RLS enforced - user can only access their account's leads
  return dbClient.rls((tx) =>
    tx.query.leads.findFirst({ where: eq(leads.id, leadId) })
  );
}

// When called from SWR, security is maintained
useSWR(['lead', leadId], () => getLeadDetails(leadId));
```

---

## Implementation Roadmap

### Phase 1: Setup (Week 1)

**Step 1:** Install SWR
```bash
pnpm add swr
```

**Step 2:** Create SWR cache keys configuration (following `routes.ts` pattern)
```typescript
// src/config/swr-keys.ts
/**
 * Centralized SWR cache keys configuration
 * Never hardcode cache keys in components - use these exports
 */

export const swrKeys = {
  dashboard: {
    stats: 'dashboard-stats',
  },
  leads: {
    pipeline: 'pipeline-leads',
    drawer: (leadId: string) => ['lead-drawer', leadId] as const,
    detail: (leadId: string) => ['lead-detail', leadId] as const,
  },
  hunts: {
    list: 'account-hunts',
    detail: (huntId: string) => ['hunt-detail', huntId] as const,
  },
  credits: {
    balance: 'account-credits',
  },
  templates: {
    list: 'account-templates',
  },
} as const;
```

**Step 3:** Test SWR with existing server action (Lead Drawer)
- Lowest risk, highest impact
- Small component, no complex state interactions
- No new routes needed

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
- [ ] Uses `src/config/swr-keys.ts` for cache keys (no hardcoded strings)
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

❌ **Client-side data fetching** - Server actions work directly with SWR
❌ **Mutations** - Server actions are already optimal
❌ **Cron jobs** - Use server-side admin access
❌ **Webhooks** - External triggers, not user-facing

**API routes are only needed for:**
- ✅ Public endpoints (no authentication)
- ✅ External integrations (third-party services)
- ✅ Webhooks (external triggers)

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

**Key architectural decision:**
- ✅ **Use SWR with existing server actions** (no API routes needed)
- ✅ **Maintains codebase consistency** (server actions for both reads and writes)
- ✅ **Preserves security model** (RLS enforcement unchanged)
- ✅ **Less code to maintain** (no API route layer)

**No breaking changes required.** All migrations can be done incrementally with backward compatibility.

**Estimated total effort:** 2-3 weeks (1 developer) - Reduced from 3-4 weeks due to no API routes
**Estimated ROI:** High (improved UX, reduced server costs, better multi-user support, cleaner architecture)
