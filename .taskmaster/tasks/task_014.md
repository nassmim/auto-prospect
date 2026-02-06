# Task ID: 14

**Title:** Integrate Hunt Matching with Lead Creation

**Status:** done

**Dependencies:** 2 ✓, 3 ✓

**Priority:** high

**Description:** Daily hunt job that matches ads against user hunt criteria, sends messages, and creates both contactedAds and leads records. Implemented in src/actions/hunt.actions.ts with runDailyHunts().

**Details:**

✅ IMPLEMENTED in `src/actions/hunt.actions.ts`:

**What was built:**
- `runDailyHunts()` - Main entry point for daily cron job
- `fetchAllActiveHunts()` - Queries active baseFilters (hunts)
- `contactAdsOwners()` - Matches ads, sends messages, creates contactedAds + leads
- Uses existing `getMatchingAds()` from ad.actions.ts
- Creates both `contactedAds` (history) and `leads` (CRM) with duplicate prevention
- Terminology standardized to "hunt" throughout

**Files modified:**
- `src/actions/hunt.actions.ts` (renamed from prospecting.actions.ts)
- `src/types/hunt.types.ts` (renamed from prospecting.types.ts)
- `src/app/api/prospecting/route.ts` (updated imports)

Original task description below for reference:

Create a Hunt Matching Job system in `src/actions/hunt-matching.actions.ts`:

**Architecture Overview:**
- Lobstr Job: Already exists (`src/actions/lobstr.actions.ts`) - independently scrapes ads from LeBonCoin into the `ads` table
- Hunt Matching Job (THIS TASK): Periodically matches existing ads against user hunts and creates leads

**1. Core Matching Function:**
```typescript
export async function processHuntMatches(huntId: string): Promise<{ created: number; skipped: number }> {
  const dbClient = await createDrizzleSupabaseClient();
  
  // Fetch hunt with relations (reuse existing query pattern from prospecting.actions.ts:22-32)
  const hunt = await dbClient.admin.query.baseFilters.findFirst({
    where: eq(baseFilters.id, huntId),
    with: { location: true, subTypes: true, brands: true }
  });
  
  if (!hunt || hunt.status !== 'active') return { created: 0, skipped: 0 };
  
  // Reuse existing getMatchingAds from ad.actions.ts:155-247
  const matchingAds = await getMatchingAds(hunt, { dbClient, bypassRLS: true });
  
  // Check for existing leads (unique constraint: accountId + adId)
  const existingLeads = await dbClient.admin.select({ adId: leads.adId })
    .from(leads)
    .where(and(
      eq(leads.accountId, hunt.accountId),
      inArray(leads.adId, matchingAds.map(a => a.id))
    ));
  
  const existingAdIds = new Set(existingLeads.map(l => l.adId));
  const newAds = matchingAds.filter(ad => !existingAdIds.has(ad.id));
  
  // Create leads for new matches only
  if (newAds.length > 0) {
    await dbClient.admin.insert(leads).values(
      newAds.map(ad => ({
        accountId: hunt.accountId,
        huntId: huntId,
        adId: ad.id,
        stage: 'nouveau',
        position: 0
      }))
    );
  }
  
  // Update hunt lastScanAt timestamp
  await dbClient.admin.update(baseFilters)
    .set({ lastScanAt: new Date() })
    .where(eq(baseFilters.id, huntId));
  
  return { created: newAds.length, skipped: existingAdIds.size };
}
```

**2. Bulk Processing for All Active Hunts:**
```typescript
export async function processAllActiveHunts(): Promise<void> {
  const dbClient = await createDrizzleSupabaseClient();
  
  // Fetch all active hunts with autoRefresh enabled
  const activeHunts = await dbClient.admin.query.baseFilters.findMany({
    where: and(
      eq(baseFilters.status, 'active'),
      eq(baseFilters.autoRefresh, true)
    ),
    columns: { id: true }
  });
  
  // Process with controlled concurrency (similar to prospecting.actions.ts:39-64)
  const concurrency = 5;
  const queue = [...activeHunts];
  const inFlight: Promise<void>[] = [];
  
  while (queue.length || inFlight.length) {
    while (inFlight.length < concurrency && queue.length) {
      const hunt = queue.shift()!;
      const promise = processHuntMatches(hunt.id)
        .catch(console.error)
        .finally(() => {
          const idx = inFlight.indexOf(promise);
          if (idx !== -1) inFlight.splice(idx, 1);
        });
      inFlight.push(promise);
    }
    if (inFlight.length) await Promise.race(inFlight);
  }
}
```

**3. API Route for Cron Trigger (`src/app/api/cron/hunt-matching/route.ts`):**
```typescript
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  await processAllActiveHunts();
  return Response.json({ success: true });
}
```

**Key Files to Reference:**
- `src/actions/ad.actions.ts:155-247` - Reuse `getMatchingAds` for filter matching
- `src/actions/prospecting.actions.ts:39-64` - Reuse concurrency pattern
- `src/schema/filter.schema.ts` - Hunt schema (`baseFilters` table)
- `src/schema/lead.schema.ts:76-79` - Unique constraint prevents duplicates

**Duplicate Prevention:** The `leads` table has a unique constraint on `(accountId, adId)` - same ad for same org = lead creation skipped

**Test Strategy:**

1. Create active hunt with specific filters. 2. Add matching ads to ads table. 3. Trigger POST /api/prospecting. 4. Verify both contactedAds and leads tables populated. 5. Run again - verify no duplicate leads (unique constraint on accountId+adId). 6. Check leads appear in Kanban with stage='contacte'.
