# Application Navigation Audit - Missing Pages and Broken Links

**Audit Date:** 2026-02-02
**Status:** Complete
**Total Issues Found:** 5 missing pages, 1 route alias issue

---

## Executive Summary

This audit identifies all navigation links, buttons, and route references in the application that point to non-existent pages or broken routes. The findings are categorized by severity and include specific file locations for each issue.

---

## Missing Pages (High Priority)

### 1. Pipeline Page - `/pipeline`
**Status:** ❌ Missing
**Severity:** High
**Referenced in:**
- `src/components/layout/sidebar.tsx:19` - Sidebar navigation item
- `src/config/routes.ts:13` - Route configuration

**Current State:**
- No page file exists at `src/app/(app)/pipeline/page.tsx`
- Sidebar shows "Pipeline" link with Squares2X2Icon
- Clicking the link results in 404 error

**Recommended Action:**
- Create full pipeline page implementation OR
- Remove from sidebar and routes config if not planned

---

### 2. Credits Page - `/credits`
**Status:** ❌ Missing
**Severity:** High
**Referenced in:**
- `src/components/layout/sidebar.tsx:22` - Sidebar navigation item
- `src/config/routes.ts:16` - Route configuration

**Current State:**
- No page file exists at `src/app/(app)/credits/page.tsx`
- Sidebar shows "Credits" link with CurrencyDollarIcon
- Clicking the link results in 404 error

**Recommended Action:**
- Create credits management page OR
- Create simple redirect/placeholder page OR
- Remove from sidebar if feature deferred

---

### 3. Hunt Edit Page - `/hunts/[id]/edit`
**Status:** ❌ Missing
**Severity:** High
**Referenced in:**
- `src/components/hunts/hunt-card.tsx:98` - Card title link
- `src/components/hunts/hunt-card.tsx:225` - "Modifier" button
- `src/components/dashboard/hunt-list-item.tsx:139` - Edit icon button

**Current State:**
- No page file exists at `src/app/(app)/hunts/[id]/edit/page.tsx`
- Multiple components link to this route
- Clicking any edit link/button results in 404 error

**Recommended Action:**
- Create edit page (likely reuse hunt-form.tsx from /hunts/new) OR
- Redirect to `/hunts/new` with pre-filled data OR
- Update components to use different edit mechanism

---

### 4. Login Page - `/login`
**Status:** ❌ Missing (Auth Disabled)
**Severity:** Low (Auth currently disabled)
**Referenced in:**
- `src/config/routes.ts:8` - Route configuration
- `src/components/layout/user-menu.tsx:13` - Router push on logout
- `src/app/(app)/layout.tsx:18` - Commented redirect logic

**Current State:**
- No page file exists at `src/app/login/page.tsx`
- Auth is currently disabled (redirect commented out in layout)
- user-menu.tsx attempts to redirect to login on logout

**Recommended Action:**
- Leave as-is until auth is re-enabled OR
- Remove route config if auth permanently disabled OR
- Create placeholder login page for future

---

## Route Alias Issues (Medium Priority)

### 5. Hunts Create Alias - `/hunts/create`
**Status:** ⚠️ Alias/Redirect Issue
**Severity:** Medium
**Referenced in:**
- `src/config/routes.ts:21` - Defined as `hunts_create`
- `src/components/dashboard/dashboard-view.tsx:26` - "Nouvelle Recherche" button
- `src/components/dashboard/dashboard-view.tsx:161` - Empty state CTA button

**Current State:**
- Route defined in config as `/hunts/create`
- Actual page exists at `/hunts/new` (`src/app/(app)/hunts/new/page.tsx`)
- No redirect or page at `/hunts/create`
- Dashboard links to `/hunts/create` but will get 404

**Recommended Action:**
- **Option A:** Update `routes.ts` to use `/hunts/new` instead of `/hunts/create`
- **Option B:** Create redirect from `/hunts/create` → `/hunts/new`
- **Option C:** Move page from `/hunts/new` to `/hunts/create`

**Recommended:** Option A (simplest, no migration needed)

---

## Existing Pages (Working Correctly) ✅

The following routes are properly implemented and working:

| Route | Page File | Status |
|-------|-----------|--------|
| `/` | `src/app/page.tsx` | ✅ Working |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | ✅ Working |
| `/hunts` | `src/app/(app)/hunts/page.tsx` | ✅ Working |
| `/hunts/new` | `src/app/(app)/hunts/new/page.tsx` | ✅ Working |
| `/leads` | `src/app/(app)/leads/page.tsx` | ✅ Working |
| `/leads/[id]` | `src/app/(app)/leads/[id]/page.tsx` | ✅ Working |
| `/templates` | `src/app/(app)/templates/page.tsx` | ✅ Working |
| `/templates/new` | `src/app/(app)/templates/new/page.tsx` | ✅ Working |
| `/settings` | `src/app/(app)/settings/page.tsx` | ✅ Working |

---

## Routes Configuration Analysis

**File:** `src/config/routes.ts`

```typescript
export const pages = {
  // Authentication
  login: "/login",                    // ❌ Missing page

  // Main app sections
  dashboard: "/dashboard",            // ✅ Working
  hunts: "/hunts",                    // ✅ Working
  pipeline: "/pipeline",              // ❌ Missing page
  templates: "/templates",            // ✅ Working
  settings: "/settings",              // ✅ Working
  credits: "/credits",                // ❌ Missing page
  leads: "/leads",                    // ✅ Working

  // Nested pages
  hunts_new: "/hunts/new",            // ✅ Working
  hunts_create: "/hunts/create",      // ⚠️ Alias issue
  templates_new: "/templates/new",    // ✅ Working
} as const;
```

---

## Sidebar Navigation Analysis

**File:** `src/components/layout/sidebar.tsx`

All sidebar items reference routes from `src/config/routes.ts`:

| Sidebar Item | Route | Icon | Status |
|--------------|-------|------|--------|
| Dashboard | `pages.dashboard` | HomeIcon | ✅ Working |
| Hunts | `pages.hunts` | MagnifyingGlassIcon | ✅ Working |
| Pipeline | `pages.pipeline` | Squares2X2Icon | ❌ Missing |
| Templates | `pages.templates` | ChatBubbleBottomCenterTextIcon | ✅ Working |
| Settings | `pages.settings` | Cog6ToothIcon | ✅ Working |
| Credits | `pages.credits` | CurrencyDollarIcon | ❌ Missing |

---

## Additional Navigation Patterns

### Router.push() Calls

**Working redirects:**
- `src/components/templates/text-template-form.tsx:98` → `pages.templates` ✅
- `src/components/hunts/hunt-form.tsx:146` → `pages.hunts` ✅
- `src/components/templates/voice-template-form.tsx:127` → `pages.templates` ✅
- `src/components/leads/leads-filters.tsx:26,67` → Query param manipulation ✅

**Problematic redirects:**
- `src/components/layout/user-menu.tsx:13` → `pages.login` ❌ (Auth disabled, page missing)

---

## Recommendations Priority Matrix

### Immediate (Before Production)
1. **Fix `/hunts/create` alias** - Update routes.ts to use `/hunts/new`
2. **Create `/hunts/[id]/edit` page** - Required for hunt editing functionality
3. **Decision on Pipeline** - Implement, defer, or remove from sidebar
4. **Decision on Credits** - Implement, defer, or remove from sidebar

### Before Auth Re-enablement
5. **Create `/login` page** - Required when auth is turned back on

### Code Cleanup
- Remove commented redirect in `src/app/(app)/layout.tsx:18`
- Consider consolidating route naming (hunts_new vs hunts_create)

---

## Testing Checklist

Manual testing steps to verify fixes:

- [ ] Click every sidebar navigation item - no 404 errors
- [ ] Click "Nouvelle Recherche" button on dashboard - correct page
- [ ] Click "Modifier" button on hunt cards - edit page loads
- [ ] Click edit icon on hunt list items - edit page loads
- [ ] Verify `/leads/${id}` links in lead-drawer work correctly ✅ (Already working)
- [ ] Logout flow (when auth re-enabled) - redirects to login page

---

## Files Requiring Updates

Based on recommendations, these files will need changes:

1. `src/config/routes.ts` - Remove `/hunts/create` or redirect it
2. `src/components/dashboard/dashboard-view.tsx` - Update to use `pages.hunts_new`
3. `src/app/(app)/hunts/[id]/edit/page.tsx` - Create new file
4. `src/app/(app)/pipeline/page.tsx` - Create new file OR remove references
5. `src/app/(app)/credits/page.tsx` - Create new file OR remove references
6. `src/components/layout/sidebar.tsx` - Possibly remove Pipeline/Credits items

---

**End of Audit**
