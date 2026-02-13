# Task ID: 86

**Title:** Create Active Hunts Fetch Worker

**Status:** done

**Dependencies:** 80 ✓

**Priority:** high

**Description:** Move the fetchAllActiveHunts function into a dedicated worker for background processing. This improves performance for accounts with many hunts by processing asynchronously.

**Details:**

1. Create new queue for active hunts:
   - Update `apps/worker/src/queues/index.ts`:
     ```typescript
     QUEUE_NAMES.ACTIVE_HUNTS = 'active-hunts';
     export const activeHuntsQueue = new Queue(QUEUE_NAMES.ACTIVE_HUNTS, { connection, defaultJobOptions });
     ```
2. Create `apps/worker/src/workers/fetch-active-hunts.ts`:
   ```typescript
   interface FetchActiveHuntsJob {
     triggeredAt: string; // ISO timestamp for tracking
   }
   ```
3. Implement `fetchActiveHuntsWorker` function:
   - Query all active hunts from database (using admin client, bypass RLS)
   - For each hunt, dispatch to hunt queue for processing:
     ```typescript
     await huntQueue.add(`daily-hunt-${hunt.id}`, { huntId: hunt.id, accountId: hunt.accountId });
     ```
   - Implement pagination for large hunt counts (1000+ hunts)
   - Log duration and hunt count for monitoring
4. Create scheduled trigger:
   - Add cron job in worker entry point or use BullMQ's `repeat` option:
     ```typescript
     activeHuntsQueue.add('daily-fetch', {}, { repeat: { cron: '0 8 * * *' } }); // 8 AM daily
     ```
5. Update QUEUE_NAMES constant and export new queue
6. Add monitoring metrics: fetch duration, hunt count, error rate

**Test Strategy:**

1. Unit test hunt fetching and queue dispatch
2. Test pagination logic with large dataset
3. Test cron scheduling configuration
4. Verify jobs appear in hunt queue
5. Performance test with 1000+ hunts
