# Task ID: 44

**Title:** Add Validation for At Least One Channel Must Be Enabled

**Status:** done

**Dependencies:** 37 ✓

**Priority:** medium

**Description:** Implement both client and server-side validation ensuring users must enable at least one messaging channel with credits when configuring a hunt.

**Details:**

Validation rules for the multi-channel hunt configuration:

1. **At least one channel enabled**: Cannot save a hunt with no channels enabled.

2. **Enabled channels must have credits**: If a channel is enabled, it must have credits > 0 allocated.

3. **Both client and server validation**: 
   - Client-side for immediate UX feedback
   - Server-side to prevent bypassing client validation

4. **French error messages**: User-facing errors should be in French per the app's locale.

**Test Strategy:**

1. Submit form with no channels enabled, verify French error message. 2. Enable channel but set 0 credits, verify error. 3. Enable channel with >0 credits, verify success. 4. Test server rejects invalid data even if client validation bypassed.
