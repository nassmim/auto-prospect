# Task ID: 64

**Title:** Update SEO utility files to use route config

**Status:** done

**Dependencies:** 58 ✓

**Priority:** low

**Description:** Replace hardcoded route strings in `src/lib/seo.ts` and `src/lib/seo-examples.ts` with references to the `pages` config.

**Details:**

Files to update:

1. **`src/lib/seo-examples.ts`** (lines 15, 31, 50, 66, 82):
   - `canonical: "/dashboard"` → `canonical: pages.dashboard`
   - `canonical: \`/leads/${lead.id}\`` → `canonical: pages.leads.detail(lead.id)`
   - `canonical: \`/hunts/${hunt.id}\`` → `canonical: pages.hunts.detail(hunt.id)`
   - `url: "/hunts/123"` → `url: pages.hunts.detail("123")`
   - `canonical: \`/leads/${id}\`` → `canonical: pages.leads.detail(id)`
   - Add import: `import { pages } from "@/config/routes"`

2. **`src/lib/seo.ts`** (line 92, if applicable):
   - Check if there are hardcoded route examples in comments/documentation and update

Note: `seo-examples.ts` may be a documentation/example file. If it's not imported anywhere, consider whether it even needs updating (it's still good practice for consistency).

**Test Strategy:**

1. Run `pnpm build` to verify no type errors
2. Verify SEO utility functions still produce correct canonical URLs
3. If seo-examples.ts is used in tests, verify tests pass
