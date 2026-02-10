# Task ID: 40

**Title:** Implement Credit Consumption Service with Atomic Balance Updates

**Status:** done

**Dependencies:** 34 ✓

**Priority:** high

**Description:** Create a service that handles credit consumption when messages are successfully sent, ensuring atomic updates and proper transaction logging.

**Details:**

When a message is successfully sent, the system needs to:

1. **Consume one credit** from the hunt's channel allocation (decrement available credits)

2. **Ensure atomicity**: Use database transactions with row-level locking to prevent race conditions (no double-spending)

3. **Log the transaction**: Create a record in the credit_transactions table for audit trail

4. **Handle errors gracefully**:
   - Return clear error if no credits configured for channel
   - Return clear error if insufficient credits
   - Only consume credit on SUCCESSFUL send, not on attempt

This runs in admin mode (bypasses RLS) since it's called from background jobs.

**Test Strategy:**

1. Test concurrent consumption doesn't cause double-spend. 2. Verify transaction rollback on failure. 3. Test insufficient credits returns error without consuming. 4. Verify credit_transactions log is created for each consumption.
