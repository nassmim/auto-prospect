# Task ID: 85

**Title:** Integrate Message Sending into Daily Hunts Workflow

**Status:** done

**Dependencies:** 81 ✓, 82 ✓, 83 ✓

**Priority:** high

**Description:** Update the hunt.service.ts to dispatch actual messages through channel queues (SMS, WhatsApp, Voice) instead of just consuming credits. Connect the web app's daily hunt logic with the worker's message queues.

**Details:**

1. Create worker API client in web app:
   - Create `apps/web/src/services/worker-api.service.ts`
   - Export `dispatchHuntMessages(huntId, accountId, contacts[])`
   - Makes HTTP POST to worker's `/api/hunt/execute` endpoint
   - Passes Bearer token from `API_SECRET` env var
2. Update `apps/web/src/services/hunt.service.ts` `contactAdsOwners` function:
   - After allocation loop, collect all allocated contacts with their channel assignments
   - Build contact list matching `HuntContact` interface from hunt.ts:
     ```typescript
     { adId, recipientPhone, channel, message, senderPhone?, audioUrl? }
     ```
   - Fetch message template for the hunt and personalize per contact
   - Call `dispatchHuntMessages(huntId, accountId, contacts)`
   - Remove the TODO comment at line 134
3. Update credit consumption flow:
   - Option A: Consume credits before dispatch (current approach) - risk of credit loss on send failure
   - Option B: Consume credits on worker success callback - requires webhook from worker
   - Recommend Option A with compensation logic on job failure
4. Add message template fetching:
   - Get hunt's message template
   - Personalize with ad data (title, price, owner name, etc.)
5. Handle partial failures gracefully:
   - If dispatch fails, credits already consumed need rollback consideration

**Test Strategy:**

1. Unit test allocation to contact mapping
2. Test message template personalization
3. Integration test with worker endpoint mocked
4. Test credit consumption/rollback flow
5. End-to-end test: trigger daily hunt → verify jobs in Redis queues
