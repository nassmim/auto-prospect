# Task ID: 84

**Title:** Implement Scraping/Lobstr Worker

**Status:** done

**Dependencies:** 80 ✓

**Priority:** high

**Description:** Create the scraping worker that processes Lobstr webhook results and saves ads to the database. Worker structure is implemented with Lobstr API integration and hunt timestamp updates. Full ad processing requires refactoring lobstr.service.ts functions into a shared package due to Next.js-specific imports blocking direct import.

**Details:**

## Current State
The scraping worker structure is implemented at `apps/worker/src/workers/scraping.ts` with:
- Lobstr API integration for fetching results (`getResultsFromRun` logic duplicated)
- Database integration using `@auto-prospect/db` (createDrizzleAdmin, hunts schema)
- Hunt `lastScanAt` timestamp update when huntId provided
- Error handling with console logging

## Blocking Issue
`apps/web/src/services/lobstr.service.ts` cannot be imported from worker because it uses Next.js path aliases:
- `@/config/platform.config` → EPlatformValue
- `@/lib/drizzle/dbClient` → createDrizzleSupabaseClient
- `@/schema` → ads, TAdInsert, TAdReferenceData
- `@/services/ad.service` → fetchAllReferenceData, setAdUpdateOnConflict
- `@/services/general.service` → sendAlertToAdmin
- `@/utils/general.utils` → customParseInt

## Required Refactoring
To complete ad processing, the following must be moved to shared packages:

### 1. Move to `@auto-prospect/shared`:
- `EPlatformValue` from platform.config
- `customParseInt` utility function
- `TAdFromLobstr` type definition
- Ad mapping logic (`getAdData` function)

### 2. Move to `@auto-prospect/db`:
- `TAdReferenceData` type
- `fetchAllReferenceData` function (currently in ad.service.ts)
- `setAdUpdateOnConflict` helper (currently in ad.service.ts)
- `DB_COLUMS_TO_UPDATE` constant

### 3. Create `packages/shared/src/services/lobstr.service.ts`:
- `saveAdsFromLobstr(runId, db)` - accepts db client as parameter
- `getAdData(ad, referenceData)` - ad mapping function
- Export `TAdFromLobstr` type

## Implementation Steps After Refactoring
1. Import refactored functions in worker:
   ```typescript
   import { saveAdsFromLobstr } from '@auto-prospect/shared/services/lobstr.service';
   import { createDrizzleAdmin } from '@auto-prospect/db';
   ```
2. Replace placeholder `handleLobstrWebhook` with actual implementation:
   ```typescript
   async function handleLobstrWebhook(runId: string): Promise<void> {
     const db = createDrizzleAdmin();
     await saveAdsFromLobstr(runId, db);
   }
   ```
3. Add admin alert integration (requires sendAlertToAdmin refactoring)
4. Use `RETRY_CONFIG.SCRAPING` from worker config

## Files to Modify
- `apps/worker/src/workers/scraping.ts` - uncomment/complete ad processing
- `packages/shared/src/services/lobstr.service.ts` - new file with refactored logic
- `packages/shared/src/index.ts` - export new service
- `packages/db/src/index.ts` - export reference data functions
- `apps/web/src/services/lobstr.service.ts` - refactor to use shared package
- `apps/web/src/services/ad.service.ts` - move shared logic to packages

**Test Strategy:**

1. Unit test refactored `saveAdsFromLobstr` with mocked Lobstr API response and db client
2. Test `getAdData` ad mapping function with various ad structures
3. Test `fetchAllReferenceData` returns correct lookup maps
4. Test worker integration with mocked shared service
5. Test hunt lastScanAt update (already implemented)
6. Test error handling for API failures and missing reference data
7. Integration test with Lobstr sandbox/test cluster
8. Verify web app still works after refactoring to use shared package

## Subtasks

### 84.1. Implement basic worker structure with Lobstr API fetching

**Status:** done  
**Dependencies:** None  

Create the scraping worker with Lobstr API integration for fetching results and hunt timestamp updates.

**Details:**

Implemented at `apps/worker/src/workers/scraping.ts` with ScrapingJob interface, handleLobstrWebhook stub, and lastScanAt update logic.

### 84.2. Refactor platform.config and utilities to shared package

**Status:** pending  
**Dependencies:** 84.1  

Move EPlatformValue and customParseInt utility to @auto-prospect/shared package for use by both web app and worker.

**Details:**

Move `EPlatformValue` enum from `apps/web/src/config/platform.config.ts` to `packages/shared/src/config/platform.config.ts`. Move `customParseInt` from `apps/web/src/utils/general.utils.ts` to `packages/shared/src/utils/general.utils.ts`. Update exports in `packages/shared/src/index.ts`.

### 84.3. Move reference data fetching to @auto-prospect/db package

**Status:** pending  
**Dependencies:** 84.2  

Refactor fetchAllReferenceData, setAdUpdateOnConflict, and related types to the db package for shared access.

**Details:**

Move from `apps/web/src/services/ad.service.ts`:
- `TAdReferenceData` type
- `fetchAllReferenceData` function
- `setAdUpdateOnConflict` helper
- `DB_COLUMS_TO_UPDATE` constant

Place in `packages/db/src/services/ad.service.ts` or similar. Update function signatures to accept db client as parameter instead of creating internally.

### 84.4. Create shared Lobstr service with ad mapping logic

**Status:** pending  
**Dependencies:** 84.2, 84.3  

Create packages/shared/src/services/lobstr.service.ts with saveAdsFromLobstr and getAdData functions that can be used by both web and worker.

**Details:**

Create `packages/shared/src/services/lobstr.service.ts` containing:
- `TAdFromLobstr` type definition
- `getAdData(ad, referenceData)` - maps Lobstr ad to TAdInsert
- `saveAdsFromLobstr(runId, db)` - fetches and saves ads using provided db client
- `getResultsFromRun(runId)` - Lobstr API call

Function signatures should accept dependencies as parameters for testability.

### 84.5. Update web app to use refactored shared services

**Status:** pending  
**Dependencies:** 84.4  

Refactor apps/web/src/services/lobstr.service.ts to import from shared package instead of local implementations.

**Details:**

Update `apps/web/src/services/lobstr.service.ts` to:
- Import `saveAdsFromLobstr`, `TAdFromLobstr` from `@auto-prospect/shared`
- Import reference data functions from `@auto-prospect/db`
- Keep `handleLobstrWebhook` as thin wrapper calling shared function
- Remove duplicated code

Similarly update `apps/web/src/services/ad.service.ts` to import from shared.

### 84.6. Complete worker ad processing integration

**Status:** pending  
**Dependencies:** 84.5  

Update apps/worker/src/workers/scraping.ts to use refactored shared services for full ad processing.

**Details:**

Update `apps/worker/src/workers/scraping.ts`:
- Import `saveAdsFromLobstr` from `@auto-prospect/shared`
- Replace placeholder handleLobstrWebhook with call to shared function
- Add proper error handling with admin alerts
- Use `RETRY_CONFIG.SCRAPING` from worker config
- Handle large batch processing (10,000 ads) with chunking if needed
