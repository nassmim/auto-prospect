# Task ID: 88

**Title:** Update Worker Routes to Use Configuration

**Status:** done

**Dependencies:** 80 ✓

**Priority:** medium

**Description:** Refactor all worker route handlers to use the centralized configuration system instead of hardcoded values, ensuring consistency and maintainability.

**Details:**

1. Update `apps/worker/src/routes/hunt.routes.ts`:
   - Import `{ API_ROUTES, QUEUE_NAMES }` from config
   - Replace hardcoded `/api/hunt/execute` with `API_ROUTES.hunt.execute`
   - Replace queue name strings with `QUEUE_NAMES.HUNT`
2. Update `apps/worker/src/routes/whatsapp.routes.ts`:
   - Import config constants
   - Replace `/api/whatsapp/text` with `API_ROUTES.whatsapp.text`
   - Replace queue name with `QUEUE_NAMES.WHATSAPP`
3. Update `apps/worker/src/routes/phone.routes.ts`:
   - Replace `/api/phone/sms` with `API_ROUTES.phone.sms`
   - Replace `/api/phone/ringless-voice` with `API_ROUTES.phone.ringlessVoice`
   - Use `QUEUE_NAMES.SMS` and `QUEUE_NAMES.VOICE`
4. Update `apps/worker/src/routes/jobs.routes.ts`:
   - Replace hardcoded paths with config
   - Use `QUEUE_NAMES` for queue validation
5. Update error messages to use config values:
   - `Queue ${QUEUE_NAMES.SMS} not found` instead of hardcoded strings
6. Verify all route registrations in `apps/worker/src/index.ts` use config
7. Run linter to ensure no unused imports from old hardcoded approach

**Test Strategy:**

1. Verify TypeScript compilation passes
2. Test each route endpoint responds correctly
3. Verify error messages include correct config values
4. No hardcoded queue names or paths remain (grep verification)
5. Integration test all API endpoints
