# Task ID: 49

**Title:** Fix /hunts/create Route (Redirect or Remove)

**Status:** done

**Dependencies:** 45 ✓

**Priority:** medium

**Description:** Dashboard links to /hunts/create but the actual create page is at /hunts/new. Either create a redirect or update the reference to use the correct path.

**Details:**

The `routes.ts` config defines both `hunts_new: '/hunts/new'` and `hunts_create: '/hunts/create'`. The actual page exists at `/hunts/new`. The dashboard view (`dashboard-view.tsx`) links to `/hunts/create`.

1. **Option A (Preferred — Simplify)**: Remove the `hunts_create` entry from `routes.ts` and update `dashboard-view.tsx` to use `pages.hunts_new` instead. This eliminates the duplicate route.

2. **Option B (Redirect)**: Create `src/app/(app)/hunts/create/page.tsx` that redirects to `/hunts/new`.

3. Search the entire codebase for any other references to `/hunts/create` or `hunts_create` and update them.

4. After fixing, verify `routes.ts` has a single, unambiguous route for creating a hunt.

**Test Strategy:**

Click the 'create hunt' button on the dashboard. Verify it navigates to the hunt creation form at /hunts/new. Search codebase for any remaining references to /hunts/create. Verify no 404 occurs.
