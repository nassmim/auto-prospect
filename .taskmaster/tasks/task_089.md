# Task ID: 89

**Title:** Create Worker Service Layer

**Status:** pending

**Dependencies:** 80 ✓

**Priority:** medium

**Description:** Create a service layer in the worker app that mirrors the web app pattern, containing reusable business logic for message sending, credit tracking, and queue management.

**Details:**

1. Create `apps/worker/src/services/` directory structure
2. Create `apps/worker/src/services/message.service.ts`:
   - `formatPhoneNumber(phone: string): string` - normalize phone format
   - `personalizeMessage(template: string, data: Record<string, string>): string`
   - `trackMessageStatus(messageId: string, status: 'sent' | 'failed' | 'delivered')`
   - Shared logic for all message types
3. Create `apps/worker/src/services/credit.service.ts`:
   - Import and re-export relevant functions from web app credit.service
   - Or create worker-specific version using admin client (bypass RLS)
   - `consumeCreditForMessage(huntId, channel, messageId)` - worker context
4. Create `apps/worker/src/services/queue.service.ts`:
   - `dispatchToChannel(channel: string, jobData: object)` - route to correct queue
   - `getJobStatus(queueName: string, jobId: string)` - fetch job status
   - `retryFailedJob(queueName: string, jobId: string)` - manual retry
5. Create `apps/worker/src/services/db.service.ts`:
   - Wrapper for database client with admin context
   - Ensures workers always bypass RLS
   - `getAdminClient()` - returns db client in admin mode
6. Create `apps/worker/src/services/index.ts` barrel export
7. Add TypeScript types for all service functions
8. Update workers to use service layer instead of inline logic

**Test Strategy:**

1. Unit test each service function
2. Test phone number formatting edge cases
3. Test message personalization with various templates
4. Test credit consumption with mocked database
5. Verify services work with worker-specific context (admin mode)
