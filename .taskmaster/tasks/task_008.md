# Task ID: 8

**Title:** Build Dashboard Page with Stats and Hunt List

**Status:** done

**Dependencies:** 2 ✓, 3 ✓, 7 ✓

**Priority:** high

**Description:** Implement the dashboard homepage showing stats cards (new leads today, messages sent), active hunts list, and quick actions. Reference: 01-dashboard-stats-projects.png

**Details:**

Create dashboard in `src/app/(app)/dashboard/page.tsx`:

1. **Stats Cards Row (Server Component queries):**
   - New leads today: COUNT from leads WHERE createdAt >= today AND organizationId = current
   - Leads contacted: COUNT from leads WHERE stage = 'contacte'
   - Messages sent (by channel): COUNT from messages grouped by channel
   - Cards with icon, value, label, optional trend indicator

2. **Active Hunts List:**
   - Query hunts WHERE status = 'active' AND organizationId = current
   - Each row shows: name, platform badge, lead count, contacted count, last scan time
   - Status indicator (green dot for active)
   - Quick actions: pause/resume button, edit link
   - Empty state with CTA to create first hunt

3. **Quick Actions:**
   - Primary CTA button: "Nouvelle Recherche" (create hunt)
   - Trial/subscription status banner (if applicable)

4. **Components:**
   - `src/components/dashboard/stat-card.tsx`
   - `src/components/dashboard/hunt-list-item.tsx`
   - Use Server Components for data fetching, Client Components only for interactivity

5. **Data Fetching Pattern:**
   ```typescript
   const db = await createDrizzleSupabaseClient();
   const stats = await db.rls((tx) => 
     tx.select({ count: sql<number>`count(*)` })
       .from(leads)
       .where(eq(leads.organizationId, orgId))
   );
   ```

**Test Strategy:**

1. Verify stats queries return correct counts. 2. Test empty state renders when no hunts exist. 3. Verify hunt list updates after pause/resume action. 4. Test loading states and error handling.
