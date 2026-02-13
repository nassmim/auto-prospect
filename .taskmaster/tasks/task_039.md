# Task ID: 39

**Title:** Build Credit Usage Display Component for Hunts

**Status:** done

**Dependencies:** 34 ✓

**Priority:** medium

**Description:** Create a component to display credit usage per channel in the hunt detail/list views, showing purchased vs used vs remaining.

**Details:**

Users need to see their credit usage at a glance:

1. **Per-channel display**: Show each channel with its allocated credits, used credits, and remaining credits.

2. **Daily pacing progress**: If a daily limit is set, show how many contacts have been made today vs the limit (with visual progress indicator).

3. **Design principles**:
   - Keep it simple and scannable
   - Handle edge cases (null daily limit, no credits allocated)
   - Per PRD: Do NOT show which channel was used for specific contacts - only show aggregated channel usage

**Test Strategy:**

1. Render with sample data, verify all credits display correctly. 2. Test progress bar at 0%, 50%, 100%, and >100%. 3. Verify component handles null dailyPacingLimit gracefully. 4. Test with empty channelCredits array.
