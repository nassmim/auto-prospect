# Task ID: 34

**Title:** Create Hunt Channel Credits Table for Per-Hunt Credit Allocation

**Status:** done

**Dependencies:** 33 ✓

**Priority:** high

**Description:** Create a new table to track how many credits are allocated/purchased per channel for each hunt, separate from the account-level credit balance.

**Details:**

Users need to allocate credits to specific hunts for specific channels. This table tracks:

- How many credits were allocated to a hunt for each channel (SMS, WhatsApp, Ringless Voice)
- How many credits have been consumed from that allocation
- One record per hunt+channel combination (unique constraint)

This is separate from the account-level creditBalances table - that tracks the org's total balance, while this tracks per-hunt allocation.

The table should cascade delete when a hunt is deleted and follow existing RLS patterns (only hunt owners can access their hunt's credit allocations).

**Test Strategy:**

1. Verify unique constraint prevents duplicate hunt+channel entries. 2. Confirm cascade delete removes credits when hunt is deleted. 3. Test RLS prevents access from non-hunt-owners. 4. Migration includes explicit grants for authenticated users.
