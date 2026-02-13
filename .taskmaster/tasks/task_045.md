# Task ID: 45

**Title:** Audit All Navigation Links and Create Missing Route Inventory

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Comprehensively audit every navigation link, button, and route reference in the application. Produce a verified inventory of all missing pages and broken links.

**Details:**

Audit all navigation references across the codebase:

1. **Sidebar navigation** (`src/components/layout/sidebar.tsx`): Currently references 6 routes - `/dashboard`, `/hunts`, `/pipeline`, `/templates`, `/settings`, `/credits`. Of these, `/pipeline` and `/credits` have NO page.tsx.

2. **Routes config** (`src/config/routes.ts`): Defines `login`, `hunts_create` routes that have no corresponding pages.

3. **In-component links**:
   - `hunt-card.tsx` and `hunt-list-item.tsx` link to `/hunts/${id}/edit` — no edit page exists
   - `dashboard-view.tsx` links to `/hunts/create` — this is an alias of `/hunts/new` but no redirect or page exists at `/hunts/create`
   - `lead-drawer.tsx` links to `/leads/${id}` — this page EXISTS at `src/app/(app)/leads/[id]/page.tsx`

4. **Missing pages confirmed**:
   - `/pipeline` — no `src/app/(app)/pipeline/page.tsx`
   - `/credits` — no `src/app/(app)/credits/page.tsx`
   - `/hunts/[id]/edit` — no `src/app/(app)/hunts/[id]/edit/page.tsx`
   - `/login` — no `src/app/login/page.tsx` (auth disabled currently)
   - `/hunts/create` — no page (should redirect to `/hunts/new` or be removed)

5. Create a markdown checklist document at `.taskmaster/docs/app-audit-fixes.md` listing all missing pages, broken links, and their locations in the codebase with file:line references.

6. For each missing page, note whether it needs a full implementation or a simple redirect/placeholder.

**Test Strategy:**

Manually navigate every link in the sidebar. Click every Link/button in hunt cards, dashboard, lead drawer, and template views. Verify no 404 errors appear. Cross-reference routes.ts entries against actual page.tsx files in the app directory.
