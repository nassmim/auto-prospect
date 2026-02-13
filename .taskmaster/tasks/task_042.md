# Task ID: 42

**Title:** Implement Daily Contact Counter Increment Logic

**Status:** done

**Dependencies:** 40 ✓

**Priority:** medium

**Description:** Create an in-memory daily contact tracking utility for use during background job execution. This tracks contacts per hunt to enforce dailyPacingLimit without database persistence.

**Details:**

Since task 35 was cancelled (no huntDailyContacts table), the daily contact counting moves to an in-memory approach during background job execution:

1. **In-Memory Counter Utility**: Create a simple counter class/object that tracks contacts per hunt during a single job run:
   ```typescript
   // src/services/daily-contact-tracker.ts
   type HuntContactTracker = Map<string, number>; // huntId -> contactCount
   
   export function createDailyContactTracker(): {
     increment: (huntId: string) => number;
     getCount: (huntId: string) => number;
     isAtLimit: (huntId: string, limit: number | null) => boolean;
   }
   ```

2. **Integration with Background Job**: The tracker is instantiated at the start of `runDailyHunts()` in `src/actions/hunt-background.actions.ts` and passed through to processing functions.

3. **Pacing Limit Check**: Before sending a message, check `isAtLimit(huntId, hunt.dailyPacingLimit)`. If at limit, skip that hunt for the rest of the job run.

4. **Increment After Send**: After successful message send (and credit consumption via task 40), call `increment(huntId)` to track the contact.

5. **No Database Persistence**: Daily counts reset naturally when the next job runs. The `dailyPacingLimit` field on the `hunts` table (from task 33) provides the configuration.

Note: This approach works because background jobs run periodically and don't need cross-job persistence for daily limits. The limit applies within each job execution context.

**Test Strategy:**

1. Unit test the tracker utility: verify increment returns updated count, getCount returns 0 for unknown huntId, isAtLimit returns true when count >= limit. 2. Test with null limit (no pacing) returns false for isAtLimit. 3. Integration test: verify background job respects pacing limit by stopping contacts for a hunt once limit reached. 4. Verify tracker resets between job runs (new instance per execution).

## Subtasks

### 42.1. Create in-memory daily contact tracker utility

**Status:** pending  
**Dependencies:** None  

Create a simple, stateless utility in `src/services/daily-contact-tracker.ts` that provides methods to track and check daily contact counts per hunt during background job execution. [Updated: 1/24/2026]

**Details:**

Implement `createDailyContactTracker()` factory function that returns an object with:
- `increment(huntId: string): number` - increments and returns new count
- `getCount(huntId: string): number` - returns current count (0 if not tracked)
- `isAtLimit(huntId: string, limit: number | null): boolean` - returns true if count >= limit (false if limit is null/undefined)

Use a Map<string, number> internally for O(1) lookups. Export types for the tracker interface.
<info added on 2026-01-24T17:19:26.678Z>
I will focus ONLY on: Analyzing the completed implementation and generating the update text for subtask 42.1. Nothing more.

Let me first analyze the implementation that was created.Implementation completed. Created `src/services/daily-contact-tracker.service.ts` with factory function `createDailyContactTracker()` returning a tracker object with: `increment(huntId, channel?)` that returns new total count, `getCount(huntId)`, `getChannelCount(huntId, channel)`, `isAtLimit(huntId, limit)`, and `getAllCounts()` for debugging. Enhanced beyond original spec with optional per-channel tracking and a channel-specific count getter. Uses nested Map structure (`Map<string, { total: number; channels: Map<string, number> }>`) for O(1) lookups. Exported `DailyContactTracker` type interface.
</info added on 2026-01-24T17:19:26.678Z>

### 42.2. Integrate tracker with background job execution

**Status:** pending  
**Dependencies:** 42.1  

Modify `runDailyHunts()` in `src/actions/hunt-background.actions.ts` to instantiate the tracker and pass it through to `bulkSend()` and `contactAdsOwners()` functions.

**Details:**

Update function signatures:
- `runDailyHunts()` creates tracker instance via `createDailyContactTracker()`
- Pass tracker to `bulkSend(hunts, dbClient, tracker)`
- Pass tracker to `contactAdsOwners(hunt, dbClient, tracker)`

This ensures all hunt processing within a single job run shares the same counter state, allowing pacing limits to work across the batch.

### 42.3. Add pacing limit enforcement in contactAdsOwners

**Status:** pending  
**Dependencies:** 42.2  

Modify the `contactAdsOwners()` function to check pacing limits before processing contacts and increment the counter after successful message sends.

**Details:**

In `contactAdsOwners()`:
1. Early return if `tracker.isAtLimit(hunt.id, hunt.dailyPacingLimit)` returns true
2. Calculate how many contacts can still be made: `remaining = dailyPacingLimit - tracker.getCount(huntId)` (if limit is set)
3. Slice `matchingAds` to not exceed remaining allowance
4. After each successful message send (when credit consumption is integrated), call `tracker.increment(hunt.id)`

Note: Step 4 will be completed when the messaging integration is done - for now, increment after the mock send.

### 42.4. Provide helper to get today's count for UI display

**Status:** pending  
**Dependencies:** None  

Create a simple query function to get today's contact count for display in the CreditUsageDisplay component, using the contactedAds table as the source of truth.

**Details:**

Since daily counts aren't persisted in a dedicated table, derive today's count from existing data:

```typescript
// src/services/daily-contact-tracker.ts (or hunt.actions.ts)
export async function getTodayContactCount(huntId: string): Promise<number> {
  // Count contactedAds created today for leads belonging to this hunt
  // Use SQL: COUNT(*) WHERE hunt_id = ? AND DATE(created_at) = CURRENT_DATE
}
```

Alternatively, count leads created today for the hunt. This provides the `dailyContactsCount` prop needed by `src/components/hunts/credit-usage-display.tsx`.
<info added on 2026-01-24T17:23:33.163Z>
I will focus ONLY on: updating subtask 42.4 details based on the user's request that this subtask is not applicable with the in-memory tracking approach. Nothing more.

Let me first analyze the codebase to understand the current implementation and verify the user's assessment.Based on my analysis of the codebase, I can confirm the user's assessment is correct. The daily contact tracker (`src/services/daily-contact-tracker.service.ts`) is an in-memory solution that resets with each job run. The `CreditUsageDisplay` component already receives `channelCredits` (from `huntChannelCredits` table showing credits consumed/allocated) and `dailyContactsCount` as props. For UI purposes, the `contactedAds` table with its `createdAt` field can be queried with a date filter to get historical daily counts.

Here is the update text:

NOT APPLICABLE: This subtask was designed for a database-persisted daily count approach that was cancelled. The implemented in-memory tracking in `src/services/daily-contact-tracker.service.ts` resets with each background job run and does not persist counts. For UI display needs, the system already provides: (1) Hunt channel credits consumed/allocated via `huntChannelCredits` table passed to `CreditUsageDisplay` component at `src/components/hunts/credit-usage-display.tsx`, (2) Historical contact counts queryable from `contactedAds` table (`src/schema/ad.schema.ts:298-334`) filtered by `createdAt` date. No additional helper function is needed as these data sources already exist. Marked as done with no implementation work required.
</info added on 2026-01-24T17:23:33.163Z>
