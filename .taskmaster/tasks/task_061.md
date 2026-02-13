# Task ID: 61

**Title:** Replace hardcoded routes in lead and template components

**Status:** done

**Dependencies:** 58 ✓

**Priority:** high

**Description:** Replace all hardcoded route strings in lead components (`lead-drawer`, `lead-detail-view`) and template components (`templates-view`, `new-template-view`, `text-template-form`, `voice-template-form`) with `pages` config references.

**Details:**

Files and changes:

**Lead components:**
1. **`src/components/leads/lead-drawer.tsx`** (line 873):
   - `` href={`/leads/${lead.id}`} `` → `href={pages.leads.detail(lead.id)}`
   - Import `pages` from `@/config/routes`
   - Note: `href={lead.ad.url}` (line 539) is an external URL — leave as-is

2. **`src/components/leads/lead-detail-view.tsx`** (lines 69, 95):
   - Already imports `pages` and uses `pages.leads` → update to `pages.leads.list`
   - External URLs (`tel:`, `ad.url`) — leave as-is

**Template components:**
3. **`src/components/templates/templates-view.tsx`** (lines 34, 50, 63, 85, 98):
   - `pages.templates_new` → `pages.templates.new` (all occurrences)
   - Template literal `` `${pages.templates_new}?type=text` `` → `` `${pages.templates.new}?type=text` ``

4. **`src/components/templates/new-template-view.tsx`** (lines 20, 57, 82):
   - `pages.templates` → `pages.templates.list`
   - `pages.templates_new` → `pages.templates.new`

5. **`src/components/templates/text-template-form.tsx`** (line 98):
   - `router.push(pages.templates)` → `router.push(pages.templates.list)`

6. **`src/components/templates/voice-template-form.tsx`** (line 127):
   - `router.push(pages.templates)` → `router.push(pages.templates.list)`

**Test Strategy:**

1. Open leads list — verify lead drawer links work
2. Open lead detail — verify back link to leads list works
3. Open templates list — verify new template links (text and voice) work
4. Create text template — verify redirect to templates list
5. Create voice template — verify redirect to templates list
6. Run `pnpm build` for type checking
