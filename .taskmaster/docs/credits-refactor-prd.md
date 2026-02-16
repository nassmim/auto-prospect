# PRD: Credits System Refactoring - Global Account Credits

## Overview

Refactor the credits system from per-hunt credit allocation to global account-level credits with hunt-level daily contact limits.

## Current (Incorrect) Implementation

The system currently uses a per-hunt credit allocation model:
- Hunt creation form collects `channelCredits` allocation (SMS: X credits, Ringless: Y credits)
- `huntChannelCredits` table stores allocated/consumed credits per hunt per channel
- Worker's `consumeCredit()` checks and consumes from hunt-specific allocations
- `creditBalances` table exists but is NOT used for credit enforcement
- Form validation requires enabled channels to have credits > 0 allocated to hunt

**Files involved in wrong implementation:**
- `apps/web/src/validation-schemas/hunt.validation.ts` - has `channelCreditsSchema` and validation rules
- `apps/web/src/components/hunts/hunt-form.tsx` - collects `channelCredits` input
- `apps/web/src/components/hunts/outreach-settings.tsx` - likely displays credit allocation UI
- `apps/web/src/actions/hunt.actions.ts` - creates `huntChannelCredits` records (lines 113-148)
- `apps/worker/src/services/credit.service.ts` - `consumeCredit()` checks `huntChannelCredits` table
- `packages/db/src/schema/credits.schema.ts` - defines `huntChannelCredits` table (lines 181-226)

## Desired Implementation

**Global Account Credits Model:**
1. Users purchase credits globally per channel → stored in `creditBalances` table
2. Hunts only specify `dailyPacingLimit` (total daily contacts across all channels)
3. Background worker checks BOTH:
   - Account's global `creditBalances` for the specific channel
   - Hunt's daily contact count vs `dailyPacingLimit`
4. Credits consumed from global `creditBalances`, tracked in `creditTransactions`

## Requirements

### R1: Database Schema Changes

**R1.1: Remove or repurpose `huntChannelCredits` table**
- Decision needed: Complete removal OR keep for analytics/reporting only
- If kept for analytics: rename to `huntChannelStats` and update to be read-only tracking
- If removed: create migration to drop table and all foreign keys

**R1.2: Ensure `creditBalances` table is primary source of truth**
- Table already exists with columns: `sms`, `ringlessVoice`, `whatsappText`
- No schema changes needed, just enforcement changes

### R2: Form and Validation Changes

**R2.1: Remove channel credits allocation from hunt form**
- Remove `channelCredits` field from `huntFormSchema` in `hunt.validation.ts`
- Remove `channelCreditsSchema` entirely from `hunt.validation.ts`
- Remove channel credits validation refinement (lines 78-102 in validation file)
- Update `THuntFormData` type to not include `channelCredits`

**R2.2: Update `createHuntSchema` and `updateHuntSchema`**
- Remove `channelCredits` field from both schemas
- Remove channel credits validation refinement from `createHuntSchema` (lines 148-172)
- Keep `dailyPacingLimit` field (this is correct - it's contact count, not credits)

**R2.3: Update hunt form component**
- Remove `channelCredits` field from form default values (lines 98-103 in `hunt-form.tsx`)
- Remove `channelCredits` watch (lines 137-141)
- Remove any UI elements that collect channel credit allocation input

**R2.4: Update OutreachSettings component**
- Check if `outreach-settings.tsx` has any credit allocation UI
- Remove credit allocation inputs if present
- Keep only channel enable/disable toggles and template selection

### R3: Server Actions Changes

**R3.1: Update `createHunt` action**
- Remove huntChannelCredits insertion logic (lines 113-148 in `hunt.actions.ts`)
- Remove channelCredits from validated data usage
- Keep all other hunt creation logic intact

**R3.2: Update `updateHunt` action**
- Check if it has any huntChannelCredits update logic
- Remove if present

### R4: Worker Credit Service Refactoring

**R4.1: Rewrite `consumeCredit()` function**
- Current location: `apps/worker/src/services/credit.service.ts`
- Remove huntChannelCredits query and checks (lines 48-71)
- Implement new logic:
  1. Get hunt's accountId
  2. Lock and query `creditBalances` for that account
  3. Check if account has sufficient credits for the channel
  4. WhatsApp special case: unlimited (never fail on balance check)
  5. SMS/Ringless: fail if balance <= 0
  6. Atomically decrement credit in `creditBalances` using SQL
  7. Create `creditTransactions` log with new balance
  8. Return success/failure

**R4.2: Update `getRemainingCredits()` function**
- Change from querying `huntChannelCredits` to querying `creditBalances`
- Accept `accountId` parameter instead of `huntId`
- For WhatsApp: return `WHATSAPP_DAILY_LIMIT` (unchanged)
- For other channels: return balance from `creditBalances` table

### R5: Background Job Changes

**R5.1: Update daily hunt orchestrator**
- Before processing each hunt, check:
  1. Account's global credit balance for enabled channels
  2. Hunt's daily contact count (use in-memory tracker from task 42)
- Skip hunt if insufficient global credits OR daily limit reached
- Pass accountId to credit consumption functions

**R5.2: Integrate with daily contact tracker**
- Use existing `createDailyContactTracker()` from task 42
- Check `isAtLimit(huntId, hunt.dailyPacingLimit)` before sending
- Increment tracker after successful send
- Daily limit is total contacts, not per-channel

### R6: Web Service Changes

**R6.1: Update `credit.service.ts` (web)**
- Remove or update `getHuntChannelCredits()` function (line 48)
- If huntChannelCredits table is kept for analytics: update to return stats only
- If table is removed: delete this function
- Keep `getAccountCredits()` function - it correctly queries `creditBalances`

**R6.2: Update `hunt.service.ts`**
- Search for any huntChannelCredits queries
- Remove or update to use creditBalances
- Update hunt detail fetching if it includes channel credit data

### R7: UI Component Updates

**R7.1: Update CreditUsageDisplay component**
- Current location: `apps/web/src/components/hunts/credit-usage-display.tsx`
- Change from showing hunt-specific credit allocation to showing:
  - Account's global balance per channel
  - Hunt's daily contact count / daily limit
- Update props interface to reflect new data structure

**R7.2: Update HuntCard component**
- Check `apps/web/src/components/hunts/hunt-card.tsx`
- Remove any hunt-specific credit display
- Show daily contact count vs limit instead

**R7.3: Create or update Credits page**
- Should display global account balances from `creditBalances`
- Show transaction history from `creditTransactions`
- No per-hunt allocation needed

### R8: Migration Strategy

**R8.1: Data migration (if keeping huntChannelCredits for analytics)**
- No data migration needed - table remains as-is for historical tracking
- Update all application code to ignore it for enforcement

**R8.2: Data migration (if removing huntChannelCredits)**
- Create migration to drop `huntChannelCredits` table
- Drop foreign key constraints first
- Drop indexes
- Drop table
- Update any views or functions that reference it

**R8.3: Ensure creditBalances is populated**
- Verify all existing accounts have a creditBalances row
- Create migration to insert missing rows with 0 balance
- Set default values: sms=0, ringlessVoice=0, whatsappText=0

## Validation & Testing

### V1: Form Validation
- Hunt creation form no longer asks for credit allocation
- Form only requires: name, channel selection, template selection, daily limit
- Form submission succeeds without channel credit input

### V2: Credit Consumption
- Worker consumes from global creditBalances, not huntChannelCredits
- Concurrent sends don't cause race conditions (atomic updates)
- Credit consumption creates creditTransactions records
- WhatsApp sends never fail due to credits (unlimited)
- SMS/Ringless sends fail gracefully when account balance is 0

### V3: Daily Limits
- Background job respects hunt's dailyPacingLimit
- In-memory tracker prevents exceeding limit within single job run
- Limit is total contacts, not per-channel

### V4: UI Display
- Hunt detail page shows daily contact count vs limit
- Credits page shows global account balances
- No hunt-specific credit allocation UI visible

## Decision Points

### D1: huntChannelCredits table fate
**Options:**
- A) Complete removal (cleaner, simpler schema)
- B) Keep for analytics/reporting (historical tracking of which hunts used credits)

**Recommendation:** Option A (complete removal) - simplify the schema. Credit usage can be tracked via `creditTransactions` table which already has transaction history.

### D2: Migration timing
**Options:**
- A) Single migration doing all schema + code changes
- B) Multi-step: deprecate usage first, then remove table later

**Recommendation:** Option A - do all changes together since this is a breaking change anyway.

## Success Criteria

1. ✅ Hunt creation form does NOT collect channel credit allocation
2. ✅ `huntChannelCredits` table removed or marked analytics-only
3. ✅ Worker `consumeCredit()` uses `creditBalances` table exclusively
4. ✅ Background job checks global account credits before sending
5. ✅ Daily pacing limit enforced via in-memory tracker
6. ✅ UI displays global account credits, not hunt-specific allocations
7. ✅ All tests pass with new credit model
8. ✅ Existing hunts continue to work (migration successful)

## Out of Scope

- Credit purchase flow (already exists - purchases update `creditBalances`)
- Credit pricing or packages
- Multi-user/team credit sharing
- Credit expiration or rollover
- Refund or adjustment workflows

## Notes

- The `creditBalances` table structure is already correct and doesn't need changes
- The `creditTransactions` table is already correct for audit logging
- Only the enforcement logic needs to change (from per-hunt to global)
- Daily pacing limit concept is already correct (contact count, not credits)
- WhatsApp special handling (unlimited) should remain unchanged
