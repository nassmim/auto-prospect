# Task ID: 33

**Title:** Extend Hunt Schema with Daily Pacing Limit and Channel Enable Flags

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Update the hunts schema to add a daily pacing limit field and refine the outreachSettings JSONB structure to support enabling/disabling each messaging channel (SMS, WhatsApp Text, Ringless Voice).

**Details:**

The hunt schema needs two enhancements:

1. **Daily Pacing Limit**: A field that limits how many contacts can be made per day for a hunt, across ALL channels combined. This prevents overwhelming users with too many contacts at once. A null value means unlimited.

2. **Channel Enable Flags**: The outreachSettings JSONB should have boolean flags for each channel type (SMS, WhatsApp, Ringless Voice) to let users enable/disable specific channels per hunt.

These changes support the multi-channel messaging feature where users allocate credits to specific channels and control their daily outreach volume.

**Test Strategy:**

1. Verify migration generates correct SQL for the new field. 2. Confirm existing hunts without dailyPacingLimit continue to work (null = unlimited). 3. Validate Zod schema rejects invalid limits (<1 or >1000). 4. TypeScript compilation passes with updated types.
