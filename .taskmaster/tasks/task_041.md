# Task ID: 41

**Title:** Create Background Job Channel Allocation Logic

**Status:** done

**Dependencies:** 36 ✓, 40 ✓

**Priority:** high

**Description:** Implement the core logic that allocates ads to channels based on priority, available credits, and daily pacing limits.

**Details:**

The channel allocator is the brain of the multi-channel system. Given a list of uncontacted ads for a hunt, it determines:

1. **How many can we contact today?** Check daily pacing limit vs today's count.

2. **Which channels have credits?** Only consider enabled channels with remaining credits.

3. **In what order?** Try channels in priority order (from channel priority config).

4. **The allocation**: Return a list of (adId, channel) pairs representing which ad should be contacted via which channel.

Logic flow:
- Respect daily limit first (stop if reached)
- Try highest priority channel first
- Allocate as many ads as that channel has credits for
- Move to next priority channel, repeat
- Return all allocations

**Test Strategy:**

1. Test allocation respects daily limit. 2. Verify channel priority order is followed. 3. Test allocation stops when credits exhausted. 4. Test disabled channels are skipped. 5. Edge case: no credits available returns empty array.
