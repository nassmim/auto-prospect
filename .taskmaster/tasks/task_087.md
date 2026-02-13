# Task ID: 87

**Title:** Create Daily Hunts Orchestrator Worker

**Status:** done

**Dependencies:** 85 ✓, 86 ✓

**Priority:** high

**Description:** Create a master orchestrator worker that coordinates the entire daily hunt process: triggering active hunt fetches, processing each hunt, managing concurrency, and tracking overall progress.

**Details:**

1. Create new queue for orchestrator:
   - Add to `QUEUE_NAMES`: `DAILY_ORCHESTRATOR = 'daily-orchestrator'`
2. Create `apps/worker/src/workers/daily-orchestrator.ts`:
   ```typescript
   interface DailyOrchestratorJob {
     triggeredAt: string;
     source: 'cron' | 'manual';
   }
   ```
3. Implement `dailyOrchestratorWorker` function:
   - Create daily contact tracker instance (import from web app service)
   - Fetch all active hunts (could delegate to fetch-active-hunts worker or do inline)
   - Process hunts with controlled concurrency (5 parallel as in current bulkSend):
     ```typescript
     const pLimit = require('p-limit');
     const limit = pLimit(5);
     await Promise.all(hunts.map(hunt => limit(() => processHunt(hunt, dailyContactTracker))));
     ```
   - For each hunt, dispatch contacts to hunt queue
   - Track overall progress: hunts processed, messages queued, errors
   - Respect daily contact limits across all hunts
4. Add comprehensive logging:
   - Start/end timestamps
   - Hunts processed count
   - Total messages dispatched
   - Error summary
5. Create scheduled trigger:
   - Cron at configured time (e.g., 8 AM local time)
6. Add graceful error handling:
   - One hunt failure shouldn't stop others
   - Aggregate errors for post-run reporting

**Test Strategy:**

1. Unit test orchestration flow with mocked workers
2. Test concurrency limiting (max 5 parallel)
3. Test daily contact tracker integration
4. Test error isolation between hunts
5. Integration test full daily run with test data
