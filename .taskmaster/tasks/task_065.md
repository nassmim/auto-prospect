# Task ID: 65

**Title:** Remove backward-compatible aliases and clean up old route keys

**Status:** done

**Dependencies:** 59 ✓, 60 ✓, 61 ✓, 62 ✓, 63 ✓, 64 ✓

**Priority:** medium

**Description:** Remove any temporary backward-compatible aliases (flat keys like `hunts_new`, `hunts_create`, `templates_new`) from routes.ts and fix any remaining references to the old structure.

**Details:**

After all components and actions have been migrated:

1. **Remove old flat keys from `src/config/routes.ts`**:
   - Remove `hunts_new`, `hunts_create`, `templates_new` if they were kept as aliases
   - Remove old `PageKey` and `PageValue` types if no longer applicable
   - Create new utility types if needed:
     ```typescript
     // Helper type to extract all static route strings
     type ExtractStaticRoutes<T> = {
       [K in keyof T]: T[K] extends string ? T[K] : never;
     }[keyof T];
     ```

2. **Final grep verification** — search for any remaining references to old keys:
   - `pages.hunts_new` → should be 0 results
   - `pages.hunts_create` → should be 0 results
   - `pages.templates_new` → should be 0 results
   - `pages.hunts` used as a string (not `pages.hunts.list`) → should be 0 results
   - `pages.templates` used as a string (not `pages.templates.list`) → should be 0 results
   - `pages.leads` used as a string (not `pages.leads.list`) → should be 0 results

3. **Search for any remaining hardcoded route strings**:
   - Grep for `"/hunts`, `"/leads`, `"/templates`, `"/settings`, `"/dashboard`, `"/login`, `"/credits`, `"/pipeline`
   - Exclude `routes.ts` itself from the search
   - Any remaining matches should be external URLs, comments, or the proxy file's commented-out code

**Test Strategy:**

1. Run `pnpm build` — zero type errors
2. Run full grep audit to confirm zero hardcoded route strings outside of `routes.ts`
3. Test all major navigation flows end-to-end:
   - Login → Dashboard → Hunts → Hunt Detail → Hunt Edit
   - Dashboard → Create Hunt → Hunts List
   - Leads List → Lead Detail → Back to Leads
   - Templates List → New Template (text/voice) → Back to Templates
   - Settings page navigation
4. Test all server action revalidations work
