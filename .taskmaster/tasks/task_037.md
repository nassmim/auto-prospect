# Task ID: 37

**Title:** Update Hunt Form UI with Channel Credits and Daily Pacing Limit

**Status:** done

**Dependencies:** 33 ✓, 34 ✓

**Priority:** high

**Description:** Extend the OutreachSettings component to include credit input fields for each enabled channel and a daily pacing limit field. Update validation schemas accordingly.

**Details:**

The hunt creation/edit form needs UI for the new multi-channel features:

1. **Per-channel credit allocation**: When a channel is enabled, show an input for how many credits to allocate to that channel for this hunt. Explain that 1 credit = 1 contact.

2. **Daily pacing limit**: A separate field to set the maximum contacts per day across all channels. Optional field (null = unlimited).

3. **Validation**: 
   - Credits must be non-negative integers
   - Daily limit must be between 1-1000 if set
   - At least one channel must be enabled (handled in separate task)

Per PRD requirement: Do NOT show which specific channel was used to contact leads anywhere in the UI.

**Test Strategy:**

1. Verify credit inputs appear only when channel is enabled. 2. Test form validation rejects negative credits. 3. Test daily limit validation (min 1, max 1000 when set). 4. Verify form submits correctly with all new fields.
