# Hardcoded Route Strings Audit

**Generated:** 2026-02-02
**Purpose:** Comprehensive catalog of all hardcoded route strings in the codebase to guide migration to centralized route configuration.

---

## Summary

This audit identifies all locations where route strings are hardcoded in the codebase. The centralized route configuration exists at `src/config/routes.ts` with the `pages` object.

**Total Hardcoded Routes Found:** 16 instances
**Files Affected:** 14 files

---

## Hardcoded Routes by Category

### 1. Navigation Links (href attributes)

#### Dynamic Hunt/Lead Routes
These use template literals to construct routes with IDs:

| File | Line | Current Code | Should Use |
|------|------|--------------|------------|
| `src/components/dashboard/hunt-list-item.tsx` | 37 | `href={\`/hunts/${hunt.id}\`}` | Helper function needed |
| `src/components/dashboard/hunt-list-item.tsx` | 127 | `href={\`/hunts/${hunt.id}/edit\`}` | Helper function needed |
| `src/components/hunts/hunt-card.tsx` | 98 | `href={\`/hunts/${hunt.id}/edit\`}` | Helper function needed |
| `src/components/hunts/hunt-card.tsx` | 225 | `<Link href={\`/hunts/${hunt.id}/edit\`}>` | Helper function needed |
| `src/components/leads/lead-drawer.tsx` | 873 | `href={\`/leads/${lead.id}\`}` | Helper function needed |

**Note:** These dynamic routes cannot use the static `pages` object directly. Requires helper functions like:
```typescript
// Proposed solution
export const getHuntEditPath = (id: string) => `${pages.hunts}/${id}/edit`;
export const getLeadDetailPath = (id: string) => `${pages.leads}/${id}`;
```

#### Static Navigation
These should directly use the `pages` object from `src/config/routes.ts`:

| File | Line | Current Code | Should Use |
|------|------|--------------|------------|
| `src/app/(app)/pipeline/page.tsx` | 52 | `href={pages.leads}` | ✅ Already using `pages` |
| `src/app/(app)/pipeline/page.tsx` | 58 | `href={pages.dashboard}` | ✅ Already using `pages` |
| `src/app/(app)/credits/page.tsx` | 52 | `href={pages.hunts}` | ✅ Already using `pages` |
| `src/app/(app)/credits/page.tsx` | 58 | `href={pages.dashboard}` | ✅ Already using `pages` |
| `src/components/layout/sidebar.tsx` | 17-22 | Navigation array uses `pages.*` | ✅ Already using `pages` |
| `src/components/dashboard/dashboard-view.tsx` | 26, 123, 161 | Uses `pages.*` | ✅ Already using `pages` |
| `src/components/hunts/new-hunt-view.tsx` | 12 | `href={pages.hunts}` | ✅ Already using `pages` |
| `src/components/hunts/edit-hunt-view.tsx` | 17 | `href={pages.hunts}` | ✅ Already using `pages` |
| `src/components/hunts/hunts-view.tsx` | 27, 73 | `href={pages.huntsNew}` | ✅ Already using `pages` |
| `src/components/templates/new-template-view.tsx` | 20, 57, 82 | Uses `pages.*` | ✅ Already using `pages` |
| `src/components/templates/templates-view.tsx` | 34, 50, 63, 85, 98 | Uses `pages.*` | ✅ Already using `pages` |
| `src/components/leads/lead-detail-view.tsx` | 69, 95 | `href={pages.leads}` | ✅ Already using `pages` |
| `src/components/hunts/outreach-settings.tsx` | 271 | `href={pages.templatesNew}` | ✅ Already using `pages` |

---

### 2. Server Actions & Services

#### revalidatePath() Calls
All revalidatePath calls use hardcoded strings:

| File | Lines | Current Code | Should Use |
|------|-------|--------------|------------|
| `src/actions/team.actions.ts` | 31, 62 | `revalidatePath("/settings")` | `revalidatePath(pages.settings)` |
| `src/actions/account.actions.ts` | 33 | `revalidatePath("/settings")` | `revalidatePath(pages.settings)` |
| `src/actions/lead.actions.ts` | 47, 89, 160, 201, 325 | `revalidatePath("/leads")` | `revalidatePath(pages.leads)` |
| `src/actions/lead.actions.ts` | 246, 296 | `revalidatePath(\`/leads/${leadId}\`)` | Use helper function |
| `src/actions/message.actions.ts` | 86, 126, 214 | `revalidatePath("/templates")` | `revalidatePath(pages.templates)` |
| `src/services/message.service.ts` | 222 | `revalidatePath(\`/leads/${leadId}\`)` | Use helper function |

#### router.push() Calls
Client-side navigation using Next.js router:

| File | Line | Current Code | Should Use |
|------|------|-------------|------------|
| `src/components/hunts/hunt-form.tsx` | 159 | `router.push(pages.hunts)` | ✅ Already using `pages` |
| `src/components/templates/text-template-form.tsx` | 98 | `router.push(pages.templates)` | ✅ Already using `pages` |
| `src/components/templates/voice-template-form.tsx` | 127 | `router.push(pages.templates)` | ✅ Already using `pages` |
| `src/components/layout/user-menu.tsx` | 13 | `router.push(pages.login)` | ✅ Already using `pages` |
| `src/components/leads/leads-filters.tsx` | 26 | `router.push(\`${pathname}?${queryString}\`)` | ✅ Uses pathname from usePathname() |
| `src/components/leads/leads-filters.tsx` | 67 | `onClick={() => router.push(pathname)}` | ✅ Uses pathname from usePathname() |

---

### 3. Metadata & SEO

#### SEO Configuration Files
Routes in SEO examples and metadata:

| File | Lines | Current Code | Should Use |
|------|-------|--------------|------------|
| `src/lib/seo.ts` | 92 | Example: `canonical: "/dashboard"` | Documentation only |
| `src/lib/seo-examples.ts` | 15 | `canonical: "/dashboard"` | Helper function needed |
| `src/lib/seo-examples.ts` | 31 | `canonical: \`/leads/${lead.id}\`` | Helper function needed |
| `src/lib/seo-examples.ts` | 50 | `canonical: \`/hunts/${hunt.id}\`` | Helper function needed |
| `src/lib/seo-examples.ts` | 66 | `{ name: "Ma chasse", url: "/hunts/123" }` | Example breadcrumb |
| `src/app/(app)/leads/[id]/page.tsx` | 33 | `canonical: \`/leads/${id}\`` | Helper function needed |
| `src/app/(app)/templates/new/page.tsx` | 21 | `canonical: \`/templates/new?type=${type}\`` | Helper function needed |

---

### 4. Commented Out / Unused Routes

These are commented out but should be updated for consistency:

| File | Line | Current Code | Notes |
|------|------|--------------|-------|
| `src/lib/supabase/proxy.ts` | 42, 47 | `!request.nextUrl.pathname.startsWith('/login')` | Auth middleware (commented) |
| `src/lib/supabase/proxy.ts` | 48 | `return NextResponse.redirect(url)` | Redirect logic (commented) |
| `src/app/(app)/layout.tsx` | 18 | `redirect(pages.login)` | Already uses `pages` (commented) |

---

### 5. External Links (Out of Scope)

The following external URLs are not part of this audit:
- Vercel templates, Next.js docs, Chrome Web Store (in `src/app/page.tsx`, `src/components/settings/connected-accounts-tab.tsx`)
- External ad URLs (`lead.ad.url`, phone numbers with `tel:`)

---

## Missing Route Definitions

The following dynamic routes need helper functions in `src/config/routes.ts`:

```typescript
// Add to src/config/routes.ts

/**
 * Dynamic route builders for routes with parameters
 */
export const getHuntPath = (id: string) => `${pages.hunts}/${id}` as const;
export const getHuntEditPath = (id: string) => `${pages.hunts}/${id}/edit` as const;
export const getLeadDetailPath = (id: string) => `${pages.leads}/${id}` as const;
export const getTemplatesNewPath = (type: 'text' | 'voice') => `${pages.templatesNew}?type=${type}` as const;
```

---

## Recommendations

### Immediate Actions (High Priority)

1. **Add Dynamic Route Helpers**
   Extend `src/config/routes.ts` with helper functions for dynamic routes (hunt/{id}, lead/{id}, etc.)

2. **Update revalidatePath Calls**
   Replace all hardcoded strings in server actions/services with `pages.*` references (14 instances)

3. **Update SEO Metadata**
   Create SEO helper functions in `src/lib/seo.ts` that use route helpers

### Secondary Actions (Medium Priority)

4. **Update Dynamic Links**
   Replace template literal hrefs with route helper functions (5 instances)

5. **Update SEO Examples**
   Refactor `src/lib/seo-examples.ts` to use route helpers

### Low Priority

6. **Update Commented Code**
   Update commented-out route references in proxy/middleware for future consistency

---

## Files Requiring Changes

**High Priority (Server Actions):**
- `src/actions/team.actions.ts` (2 changes)
- `src/actions/account.actions.ts` (1 change)
- `src/actions/lead.actions.ts` (7 changes)
- `src/actions/message.actions.ts` (3 changes)
- `src/services/message.service.ts` (1 change)

**Medium Priority (Dynamic Links):**
- `src/components/dashboard/hunt-list-item.tsx` (2 changes)
- `src/components/hunts/hunt-card.tsx` (2 changes)
- `src/components/leads/lead-drawer.tsx` (1 change)

**Low Priority (SEO/Examples):**
- `src/lib/seo-examples.ts` (4 changes)
- `src/app/(app)/leads/[id]/page.tsx` (1 change)
- `src/app/(app)/templates/new/page.tsx` (1 change)
- `src/lib/supabase/proxy.ts` (commented code)

---

## Already Using Centralized Routes ✅

The following files are **already correctly using** `src/config/routes.ts`:
- All sidebar navigation (`src/components/layout/sidebar.tsx`)
- All hunt form navigation (`src/components/hunts/hunt-form.tsx`)
- All template form navigation
- Dashboard links (`src/components/dashboard/dashboard-view.tsx`)
- User menu logout (`src/components/layout/user-menu.tsx`)
- Pipeline/Credits placeholder pages
- Most router.push() calls

---

## Verification Commands

Use these commands to verify all hardcoded routes have been addressed:

```bash
# Find all revalidatePath with string literals
grep -rn 'revalidatePath.*"/' src/actions src/services

# Find all href with template literals containing /hunts/ or /leads/
grep -rn 'href={\`/\(hunts\|leads\)' src/components

# Find all canonical URLs in metadata
grep -rn 'canonical:.*"/' src/app src/lib

# Verify all imports of pages object
grep -rn 'from "@/config/routes"' src/
```

Expected result after migration: Zero matches for hardcoded strings, all using `pages` object or route helpers.
