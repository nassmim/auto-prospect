# Worker Implementation PRD

## Overview
This PRD outlines the tasks needed to complete the worker implementation for Auto-Prospect. The worker service handles background jobs for scraping, messaging (SMS, WhatsApp, Voice), and daily hunt processing using BullMQ queues.

## Context
- Most services/actions already exist in `apps/web/src/services/` and `apps/web/src/actions/`
- Basic worker structure exists in `apps/worker/src/`
- SMS, WhatsApp, and Voice message sending have been implemented
- Scraping using Lobstr has been implemented
- Daily hunts preparation logic exists but needs integration with actual sending
- Queue infrastructure is set up with QUEUE_NAMES constants pattern

## Goals
1. Integrate existing services into worker structure
2. Complete daily hunts implementation with actual message sending
3. Move active hunts fetching to worker (performance optimization)
4. Create configuration files to avoid hardcoded values (routes, queues, job IDs)

---

## Task 1: Create Worker Configuration System

**Priority**: High
**Complexity**: 4

### Description
Create a centralized configuration system for workers following the same pattern as `apps/web/src/config/routes.ts`. This will store all worker-related constants including:
- Queue names (already exists in queues/index.ts)
- Job ID patterns
- Worker routes
- Retry configurations
- Timeout values

### Requirements
- Create `apps/worker/src/config/worker.config.ts` file
- Export constants for job ID templates (e.g., `hunt-${huntId}-sms-${adId}`)
- Export constants for worker routes
- Export queue configuration objects (attempts, backoff settings)
- Update existing code to use these constants instead of hardcoded strings
- Follow the same export pattern as `apps/web/src/config/routes.ts`

### Files to Modify
- Create: `apps/worker/src/config/worker.config.ts`
- Update: `apps/worker/src/workers/hunt.ts` (use new constants)
- Update: `apps/worker/src/routes/*.ts` (use new constants)

### Acceptance Criteria
- No hardcoded job IDs, retry configs, or route paths in worker files
- Configuration file exports all necessary constants
- Existing workers use the new configuration
- Pattern is consistent with web app's config approach

---

## Task 2: Implement SMS Worker

**Priority**: High
**Complexity**: 6

### Description
Create the SMS worker that processes jobs from the SMS queue. The worker should integrate with the existing SMS service from `apps/web/src/services/message.service.ts` which uses SMSMobileAPI.

### Requirements
- Create `apps/worker/src/workers/sms.ts`
- Process SMS queue jobs with recipient phone and message
- **INTEGRATION ONLY**: Import and use existing `sendSms()` function from `apps/web/src/services/message.service.ts` (line 260-286)
- The existing function uses SMSMobileAPI: `https://api.smsmobileapi.com/sendsms/`
- Fetch user's encrypted SMS API key from account (see `sendSmsAction` line 278-336 for pattern)
- Decrypt API key using `SMS_API_KEY_ENCRYPTION_KEY` env var
- Handle metadata (huntId, accountId, adId) for tracking
- Implement proper error handling and retry logic
- Update message status in database after sending
- Track credit consumption

### Files to Create/Modify
- Create: `apps/worker/src/workers/sms.ts`
- Import from: `apps/web/src/services/message.service.ts` (sendSms function)
- Import from: `apps/web/src/utils/crypto.utils.ts` (decryptCredentials)
- Create: Worker registration in main worker file

### Acceptance Criteria
- SMS worker processes jobs from SMS queue
- Uses existing `sendSms()` function (no new implementation)
- Properly decrypts user's API key from account
- Messages are sent via SMSMobileAPI
- Errors are logged and retried appropriately
- Message status is tracked in database
- Credits are consumed on successful send

---

## Task 3: Implement WhatsApp Worker

**Priority**: High
**Complexity**: 7

### Description
Create the WhatsApp worker that processes jobs from the WhatsApp queue using the existing WhatsApp service (`apps/web/src/services/whatsapp.service.ts`).

### Requirements
- Create `apps/worker/src/workers/whatsapp.ts`
- Process WhatsApp queue jobs with sender phone, recipient phone, and message
- Integrate with existing `whatsapp.service.ts` functions:
  - `getWhatsAppSession`
  - `connectWithCredentials`
  - `sendWhatsAppMessage`
- Handle session management and reconnection
- Implement proper error handling for WhatsApp-specific errors
- Update message status in database
- Track credit consumption

### Files to Create/Modify
- Create: `apps/worker/src/workers/whatsapp.ts`
- Import from: `apps/web/src/services/whatsapp.service.ts`
- Create: Worker registration

### Acceptance Criteria
- WhatsApp worker processes jobs from queue
- Uses existing WhatsApp service functions
- Handles session states properly
- Messages are sent via Baileys
- Errors are handled with appropriate retry logic
- Credits are consumed on successful send

---

## Task 4: Implement Voice/Ringless Voice Worker

**Priority**: High
**Complexity**: 7

### Description
Create the Voice worker that processes jobs from the Voice queue for ringless voicemail delivery. The worker should integrate with the existing Voice Partner service from `apps/web/src/actions/voice.actions.ts`.

### Requirements
- Create `apps/worker/src/workers/voice.ts`
- Process Voice queue jobs with recipient phone and audioUrl (tokenAudio)
- **INTEGRATION ONLY**: Import and use existing `sendVoiceMessage()` function from `apps/web/src/actions/voice.actions.ts` (line 27-87)
- The existing function uses Voice Partner API: `https://api.voicepartner.fr/v1/campaign/send`
- Uses `VOICE_PARTNER_API_KEY` from env var (already configured)
- Handle metadata (huntId, accountId, adId) for tracking
- Implement proper error handling and retry logic
- Update message status in database
- Track credit consumption
- **Note**: The existing implementation only supports pre-recorded audio (tokenAudio), NOT TTS

### Files to Create/Modify
- Create: `apps/worker/src/workers/voice.ts`
- Import from: `apps/web/src/actions/voice.actions.ts` (sendVoiceMessage function)
- Create: Worker registration

### Acceptance Criteria
- Voice worker processes jobs from queue
- Uses existing `sendVoiceMessage()` function (no new implementation)
- Supports pre-recorded audio via tokenAudio parameter
- Messages are delivered via Voice Partner API
- Errors are handled appropriately
- Credits are consumed on successful send

---

## Task 5: Implement Scraping/Lobstr Worker

**Priority**: High
**Complexity**: 6

### Description
Create the scraping worker that processes Lobstr webhook results and saves ads to database using the existing Lobstr service (`apps/web/src/services/lobstr.service.ts`).

### Requirements
- Create `apps/worker/src/workers/scraping.ts`
- Process scraping queue jobs triggered by Lobstr webhooks
- Integrate with existing `lobstr.service.ts`:
  - `handleLobstrWebhook`
  - `saveAdsFromLobstr`
- Handle large batch of ads efficiently
- Implement proper error handling
- Update hunt lastScanAt timestamp after successful scrape

### Files to Create/Modify
- Create: `apps/worker/src/workers/scraping.ts`
- Import from: `apps/web/src/services/lobstr.service.ts`
- Create: Worker registration

### Acceptance Criteria
- Scraping worker processes Lobstr results
- Uses existing Lobstr service functions
- Ads are saved to database with proper mapping
- Hunt metadata is updated
- Errors are logged and handled

---

## Task 6: Integrate Message Sending into Daily Hunts

**Priority**: High
**Complexity**: 8

### Description
Update the daily hunts worker to actually send messages through the channel queues (SMS, WhatsApp, Voice) instead of just allocating and consuming credits. The allocation logic exists in `apps/web/src/services/hunt.service.ts` but needs to trigger actual message sending.

### Requirements
- Update `contactAdsOwners` function in hunt.service.ts or create worker version
- For each allocation, dispatch job to appropriate channel queue:
  - SMS queue for `sms` channel
  - WhatsApp queue for `whatsapp_text` channel
  - Voice queue for `ringless_voice` channel
- Remove TODO comment about implementing message sending
- Ensure message templates are fetched and personalized
- Pass proper metadata (huntId, accountId, adId) to channel workers
- Handle job creation errors gracefully

### Files to Modify
- Update: `apps/web/src/services/hunt.service.ts` (line 134 has TODO)
- Or create: `apps/worker/src/services/hunt-worker.service.ts` (worker-specific version)
- Update: Daily hunt worker to use integrated version

### Acceptance Criteria
- Daily hunts trigger actual message sending
- Messages are dispatched to correct channel queues
- Job IDs follow configuration pattern
- Metadata is passed correctly for tracking
- TODO comment is removed
- Credits are consumed only on successful queue dispatch

---

## Task 7: Create Get Active Hunts Worker

**Priority**: High
**Complexity**: 5

### Description
Move the `fetchAllActiveHunts` function into a dedicated worker since it can be slow with many users. This worker will fetch all active hunts and queue them for processing instead of doing it synchronously.

### Requirements
- Create `apps/worker/src/workers/fetch-active-hunts.ts`
- Move `fetchAllActiveHunts` logic from hunt.service.ts
- Queue should fetch all active hunts from database
- For each hunt, dispatch to hunt processing queue
- Implement pagination if needed for large hunt lists
- Add monitoring/logging for hunt fetch duration
- Schedule this worker to run periodically (cron job)

### Files to Create/Modify
- Create: `apps/worker/src/workers/fetch-active-hunts.ts`
- Create: New queue for active hunts fetching (or reuse existing)
- Update: Worker scheduler configuration

### Acceptance Criteria
- Active hunts are fetched in background worker
- Each hunt is queued for processing separately
- Performance is improved for high user counts
- Worker can be scheduled via cron
- Logging shows fetch duration and hunt count

---

## Task 8: Create Daily Hunts Orchestrator Worker

**Priority**: High
**Complexity**: 7

### Description
Create a master orchestrator worker that coordinates the entire daily hunt process: fetch active hunts, process each hunt, allocate to channels, and dispatch messages.

### Requirements
- Create `apps/worker/src/workers/daily-hunts-orchestrator.ts`
- Coordinate the flow:
  1. Trigger active hunts fetch worker
  2. Process each hunt with allocation logic
  3. Dispatch to channel queues
  4. Track overall progress
- Implement concurrency control (already exists in hunt.service.ts)
- Handle the daily contact tracker across all hunts
- Add comprehensive logging and monitoring
- Ensure proper error handling doesn't block other hunts

### Files to Create/Modify
- Create: `apps/worker/src/workers/daily-hunts-orchestrator.ts`
- Import: Daily contact tracker service
- Import: Hunt service functions
- Update: Scheduler to trigger orchestrator

### Acceptance Criteria
- Orchestrator manages entire daily hunt flow
- Hunts are processed with controlled concurrency
- Daily contact limits are respected across all hunts
- Progress is trackable and logged
- Errors in one hunt don't affect others

---

## Task 9: Update Worker Routes to Use Configuration

**Priority**: Medium
**Complexity**: 3

### Description
Update all worker route handlers to use the new configuration system instead of hardcoded values.

### Requirements
- Update `apps/worker/src/routes/hunt.routes.ts`
- Update `apps/worker/src/routes/whatsapp.routes.ts`
- Update `apps/worker/src/routes/phone.routes.ts`
- Update `apps/worker/src/routes/jobs.routes.ts`
- Replace hardcoded queue names with config constants
- Replace hardcoded route paths with config constants
- Ensure error messages use config values

### Files to Modify
- Update: `apps/worker/src/routes/*.ts` (all route files)
- Import from: `apps/worker/src/config/worker.config.ts`

### Acceptance Criteria
- All routes use configuration constants
- No hardcoded queue names in routes
- No hardcoded paths in routes
- Code is more maintainable

---

## Task 10: Create Worker Service Layer

**Priority**: Medium
**Complexity**: 6

### Description
Create a service layer in the worker app that mirrors the web app pattern. This will contain business logic that workers use, keeping workers thin and focused on job processing.

### Requirements
- Create `apps/worker/src/services/` directory
- Create service files for:
  - `message.service.ts` - Message sending utilities
  - `credit.service.ts` - Credit tracking (import from web)
  - `queue.service.ts` - Queue management utilities
- Import and adapt relevant functions from web app services
- Ensure services work in worker context (no RLS issues)
- Add proper TypeScript types

### Files to Create
- Create: `apps/worker/src/services/message.service.ts`
- Create: `apps/worker/src/services/credit.service.ts`
- Create: `apps/worker/src/services/queue.service.ts`
- Create: `apps/worker/src/services/index.ts` (barrel export)

### Acceptance Criteria
- Service layer exists in worker app
- Services are reusable across workers
- Business logic is separated from worker code
- Types are properly defined
- Services handle worker-specific concerns (admin DB access)

---

## Task 11: Implement Worker Error Tracking and Monitoring

**Priority**: Medium
**Complexity**: 5

### Description
Add comprehensive error tracking, logging, and monitoring to all workers for production observability.

### Requirements
- Create `apps/worker/src/utils/logger.ts` utility
- Add structured logging to all workers
- Implement error tracking (Sentry, LogRocket, or similar)
- Add job metrics (duration, success/failure rates)
- Create health check endpoint for workers
- Add queue monitoring dashboard data

### Files to Create/Modify
- Create: `apps/worker/src/utils/logger.ts`
- Create: `apps/worker/src/utils/metrics.ts`
- Update: All workers to use logger
- Create: Health check route

### Acceptance Criteria
- All workers log structured data
- Errors are tracked in monitoring system
- Job metrics are collected
- Health check endpoint returns worker status
- Queue stats are exposed for monitoring

---

## Task 12: Create Worker Documentation

**Priority**: Low
**Complexity**: 3

### Description
Document the worker architecture, job flows, and deployment instructions.

### Requirements
- Update `apps/worker/ARCHITECTURE.md` with:
  - Worker descriptions
  - Queue flows
  - Job data structures
  - Error handling strategies
- Update `apps/worker/README.md` with:
  - Setup instructions
  - Configuration guide
  - Running locally
  - Deployment process
- Add inline documentation to complex worker logic

### Files to Update
- Update: `apps/worker/ARCHITECTURE.md`
- Update: `apps/worker/README.md`
- Update: Add JSDoc comments to workers

### Acceptance Criteria
- Architecture is documented clearly
- Setup instructions are complete
- New developers can understand the system
- Deployment process is documented

---

## Dependencies

Task dependencies:
- Task 2, 3, 4, 5 depend on Task 1 (configuration system)
- Task 6 depends on Tasks 2, 3, 4 (channel workers must exist)
- Task 8 depends on Task 7 (needs active hunts worker)
- Task 8 depends on Task 6 (needs message integration)
- Task 9 depends on Task 1 (needs configuration)
- Task 10 can run in parallel with others
- Task 11 depends on all worker tasks (2-8)
- Task 12 depends on all other tasks (final documentation)

## Success Criteria

The worker implementation is complete when:
1. All message channels (SMS, WhatsApp, Voice) have working workers
2. Daily hunts automatically send messages through proper channels
3. Active hunts fetching is performed in background
4. No hardcoded values in worker code (all use configuration)
5. Error tracking and monitoring is in place
6. Documentation is complete and accurate

## Technical Notes

- Follow existing patterns from `apps/web/src/services/` and `apps/web/src/actions/`
- Ensure all database queries use admin client (bypass RLS) since workers run as system
- Use existing queue infrastructure from `apps/worker/src/queues/index.ts`
- Follow BullMQ best practices for job processing
- Ensure proper cleanup of connections (WhatsApp sessions, DB connections)
- Consider rate limiting for external APIs (Twilio, Baileys, etc.)
