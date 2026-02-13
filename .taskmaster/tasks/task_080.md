# Task ID: 80

**Title:** Create Worker Configuration System

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Create a centralized configuration system for workers following the pattern from apps/web/src/config/routes.ts. This will store all worker-related constants including job ID templates, retry configurations, timeout values, and API route paths.

**Details:**

1. Create `apps/worker/src/config/worker.config.ts` file
2. Export job ID templates as functions:
   - `jobIds.hunt.whatsapp(huntId, adId)` → `hunt-${huntId}-whatsapp-${adId}`
   - `jobIds.hunt.sms(huntId, adId)` → `hunt-${huntId}-sms-${adId}`
   - `jobIds.hunt.voice(huntId, adId)` → `hunt-${huntId}-voice-${adId}`
3. Export retry configuration object:
   ```typescript
   export const RETRY_CONFIG = {
     MESSAGE_SEND: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
     SCRAPING: { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
   } as const;
   ```
4. Export API routes constants:
   ```typescript
   export const API_ROUTES = {
     whatsapp: { text: '/api/whatsapp/text', audio: '/api/whatsapp/audio' },
     phone: { sms: '/api/phone/sms', ringlessVoice: '/api/phone/ringless-voice' },
     hunt: { execute: '/api/hunt/execute', status: (jobId: string) => `/api/hunt/status/${jobId}` },
     jobs: { status: (queue: string, jobId: string) => `/api/jobs/${queue}/${jobId}` },
   } as const;
   ```
5. Export timeout constants: `TIMEOUTS = { CONNECTION: 30000, QR_CODE: 120000, MESSAGE_ACK: 10000 }`
6. Update `apps/worker/src/workers/hunt.ts` to import and use `jobIds` and `RETRY_CONFIG` instead of hardcoded values
7. Create barrel export in `apps/worker/src/config/index.ts`

**Test Strategy:**

1. Verify all constants are exported correctly with TypeScript strict mode
2. Update hunt.ts and confirm no hardcoded job IDs remain
3. Run TypeScript compilation to catch any type errors
4. Manually verify the generated job ID format matches existing pattern
