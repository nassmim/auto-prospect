# Task ID: 62

**Title:** Replace hardcoded routes in dashboard components

**Status:** done

**Dependencies:** 58 ✓

**Priority:** medium

**Description:** Replace remaining hardcoded routes in dashboard components and page files with `pages` config references.

**Details:**

Files and changes:

1. **`src/components/dashboard/dashboard-view.tsx`** (lines 26, 123, 161):
   - `pages.hunts_create` → `pages.hunts.create`
   - `pages.hunts` → `pages.hunts.list`

2. **`src/app/(app)/dashboard/page.tsx`**:
   - Update any references to old flat keys (verify current usage)

3. **`src/app/(app)/templates/page.tsx`**:
   - Update any references to old flat keys (verify current usage)

**Test Strategy:**

1. Load dashboard page — verify all links render correctly
2. Click 'create hunt' button — verify navigation to hunt creation
3. Click 'view all hunts' link — verify navigation to hunts list
4. Run `pnpm build` for type checking
