# Task ID: 79

**Title:** Update CLAUDE.md Documentation with SWR Patterns

**Status:** done

**Dependencies:** 71 ✓, 72 ✓, 73 ✓, 74 ✓, 75 ✓

**Priority:** low

**Description:** Update CLAUDE.md data fetching guidelines and document SWR cache key usage, server action + SWR integration patterns, and decision matrix for when to use each approach.

**Details:**

Files to update: `CLAUDE.md`

Add documentation covering:

1. **Update Data Fetching Strategy section** in CLAUDE.md:
   - Add SWR as the primary client-side data fetching library
   - Update the decision matrix to include SWR-specific guidance
   - Document the `fallbackData` pattern for preserving SSR

2. **SWR Cache Keys**: Document `src/config/swr-keys.ts` usage:
   - Always import cache keys from `swrKeys` — never hardcode strings
   - Pattern for static keys (`swrKeys.dashboard.stats`) vs parameterized keys (`swrKeys.leads.drawer(leadId)`)
   - Key naming conventions

3. **Server Action + SWR Integration Pattern**:
   - Document the pattern: server action wrapper → SWR fetcher
   - Show example of `fallbackData` from server component → client SWR
   - Document optimistic update pattern with `mutate()`
   - Show polling configuration pattern

4. **When NOT to use SWR** (Non-Goals):
   - Settings page (security-sensitive)
   - Templates page (static)
   - Lead detail initial load (SEO-critical)
   - Server action mutations (already optimal)

Keep additions concise — add to existing sections rather than creating large new sections.

**Test Strategy:**

Review updated CLAUDE.md for accuracy against implemented patterns. Verify all code examples compile (spot-check TypeScript syntax). Ensure new documentation is consistent with existing style and conventions. Have another developer read the docs and attempt to implement an SWR migration following the guide.
