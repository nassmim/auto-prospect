# Task ID: 6

**Title:** Create Credits and Transactions Schema

**Status:** done

**Dependencies:** 1 ✓

**Priority:** low

**Description:** Define schemas for SMS and voice credit balances with transaction audit logging. Supports the credits purchase and usage tracking system.

**Details:**

Create `src/schema/credits.schema.ts`:

1. **credit_balances table:**
   - `id`: uuid, primary key, default random
   - `accountId`: uuid, FK to accounts.id, unique
   - `smsCredits`: integer, default 0
   - `voiceCredits`: integer, default 0
   - `updatedAt`: timestamp, default now
   - RLS: org members can read, service_role can update

2. **credit_transactions table:**
   - `id`: uuid, primary key, default random
   - `accountId`: uuid, FK to accounts.id
   - `type`: varchar enum ('purchase', 'usage', 'refund', 'adjustment')
   - `creditType`: varchar enum ('sms', 'voice')
   - `amount`: integer (positive for purchase, negative for usage)
   - `balanceAfter`: integer
   - `referenceId`: uuid nullable (message_id for usage, stripe payment_id for purchase)
   - `metadata`: jsonb nullable (pack details, pricing info)
   - `createdAt`: timestamp, default now
   - `createdById`: uuid, FK to accounts.id nullable (null for system)
   - Index on (accountId, createdAt) for transaction history
   - RLS: org members can read, service_role can insert

3. Define credit packs as constants (from PRD):
   ```typescript
   export const SMS_PACKS = [
     { credits: 100, priceEur: 15 },
     { credits: 500, priceEur: 70 },
     { credits: 1000, priceEur: 100 },
     { credits: 5000, priceEur: 400 },
   ];
   export const VOICE_PACKS = [
     { credits: 100, priceEur: 40 },
     { credits: 500, priceEur: 175 },
     { credits: 1000, priceEur: 300 },
     { credits: 5000, priceEur: 1250 },
   ];
   ```

**Test Strategy:**

1. Initialize balance for new org, verify defaults to 0. 2. Add credits via purchase transaction, verify balance updated and transaction logged. 3. Deduct credits via usage, verify atomic balance update with transaction. 4. Test insufficient balance handling.
