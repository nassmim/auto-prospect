# Task ID: 60

**Title:** Replace hardcoded routes in hunt components

**Status:** done

**Dependencies:** 58 ✓

**Priority:** high

**Description:** Replace all hardcoded route strings in hunt-related components (`hunts-view`, `new-hunt-view`, `hunt-card`, `hunt-list-item`, `hunt-form`, `outreach-settings`) with `pages` config references.

**Details:**

Files and changes:

1. **`src/components/hunts/hunts-view.tsx`** (lines 27, 73):
   - `pages.hunts_new` → `pages.hunts.new`

2. **`src/components/hunts/new-hunt-view.tsx`** (line 12):
   - `pages.hunts` → `pages.hunts.list`

3. **`src/components/hunts/hunt-card.tsx`** (lines 98, 225):
   - `` href={`/hunts/${hunt.id}/edit`} `` → `href={pages.hunts.edit(hunt.id)}`
   - Import `pages` from `@/config/routes`

4. **`src/components/dashboard/hunt-list-item.tsx`** (lines 49, 139):
   - `` href={`/hunts/${hunt.id}`} `` → `href={pages.hunts.detail(hunt.id)}`
   - `` href={`/hunts/${hunt.id}/edit`} `` → `href={pages.hunts.edit(hunt.id)}`
   - Import `pages` from `@/config/routes`

5. **`src/components/hunts/hunt-form.tsx`** (line 146):
   - `router.push(pages.hunts)` → `router.push(pages.hunts.list)`

6. **`src/components/hunts/outreach-settings.tsx`** (line 271):
   - `pages.templates_new` → `pages.templates.new`

7. **`src/app/(app)/hunts/page.tsx`** and **`src/app/(app)/hunts/new/page.tsx`**:
   - Update any references to old flat keys

**Test Strategy:**

1. Navigate to hunts list page — verify all links work
2. Click hunt cards — verify detail page loads
3. Click edit buttons — verify edit page loads
4. Create a new hunt — verify redirect to hunts list after save
5. Verify outreach settings link to templates works
6. Run `pnpm build` for type checking
