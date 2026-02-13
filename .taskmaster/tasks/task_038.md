# Task ID: 38

**Title:** Create Server Actions for Hunt Channel Credits Management

**Status:** done

**Dependencies:** 34 ✓, 37 ✓

**Priority:** high

**Description:** Implement server actions to save and retrieve hunt channel credits when creating or updating hunts.

**Details:**

Server actions needed for the hunt channel credits feature:

1. **Create hunt with credits**: When creating a hunt with enabled channels, also create the corresponding credit allocation records.

2. **Fetch hunt with credits**: Get a hunt along with its channel credit allocations (for displaying usage).

3. **Update hunt credits**: Upsert credit allocations when updating a hunt (update existing or insert new).

All actions should:
- Use RLS to ensure users only access their own data
- Validate that enabled channels have credit allocations
- Handle the transaction atomically (hunt + credits together)
- Use existing Drizzle patterns from the codebase

**Test Strategy:**

1. Create hunt with credits, verify records created in both tables. 2. Update hunt credits, verify upsert works correctly. 3. Test getHuntWithCredits returns proper data structure. 4. Verify validation rejects negative credits.
