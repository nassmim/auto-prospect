# Task ID: 43

**Title:** Update Hunt List and Detail Views to Show Credit/Pacing Info

**Status:** done

**Dependencies:** 38 ✓, 39 ✓, 42 ✓

**Priority:** medium

**Description:** Integrate the CreditUsageDisplay component into hunt cards and hunt detail views, and ensure channel-specific info is hidden from users where required.

**Details:**

Integrate the credit display throughout the hunt UI:

1. **Hunt cards**: Show summary credit info (e.g., 'X/Y crédits utilisés') and daily pacing progress if limit is set.

2. **Hunt detail page**: Show full credit breakdown using the CreditUsageDisplay component.

3. **Lead list/detail views**: Ensure channel-specific info is HIDDEN per PRD requirement:
   - Show 'Contacté' status only, NOT 'Contacté via SMS'
   - Never expose which channel was used for a specific contact

4. **Create necessary server action**: Fetch hunt with credit summary for display.

**Test Strategy:**

1. Verify hunt card shows credit summary without channel details. 2. Test hunt detail page shows full credit breakdown. 3. Verify lead cards don't expose which channel was used. 4. Test loading states for async credit data.
