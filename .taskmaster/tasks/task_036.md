# Task ID: 36

**Title:** Create Channel Priority Configuration Table (Admin-Only)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Create an admin-controlled table that stores the global channel priority order. This is app-owner controlled, not user-configurable.

**Details:**

When a lead can be contacted via multiple channels, the system needs to know which channel to try first. This table stores the priority order:

- Single row in the table (app-wide configuration)
- Lower priority number = tried first
- Default order per PRD: Ringless Voice (1), WhatsApp (2), SMS (3)
- All authenticated users can read (to know the order)
- Only service_role/admin can update (not user-configurable)

This allows the app owner to change the default channel priority without code changes.

**Test Strategy:**

1. Verify seed data inserts correct default priorities. 2. Confirm helper function returns channels in correct priority order. 3. Test that authenticated users can read but not update. 4. Verify priority changes are reflected in channel selection logic.
