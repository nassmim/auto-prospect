# Task ID: 57

**Title:** Audit all hardcoded route strings in codebase

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Perform a comprehensive search of the entire codebase to catalog every hardcoded route string, documenting the file, line number, and current usage pattern for each occurrence.

**Details:**

Use grep/ripgrep to search for all route patterns:
1. Search for `href="/` and `href={\`/` patterns in all TSX/TS files
2. Search for `redirect(` calls with string literals
3. Search for `router.push(` calls with string literals
4. Search for `revalidatePath(` calls with string literals
5. Search for template literals containing route segments like `/hunts/`, `/leads/`, `/templates/`, `/settings`, `/dashboard`, `/login`
6. Check `src/lib/seo.ts` and `src/lib/seo-examples.ts` for hardcoded routes
7. Check proxy/middleware (`src/lib/supabase/proxy.ts`) for commented-out route references

Known hardcoded locations from initial scan:
- `src/components/dashboard/hunt-list-item.tsx:49,139` — `/hunts/${hunt.id}` and `/hunts/${hunt.id}/edit`
- `src/components/leads/lead-drawer.tsx:873` — `/leads/${lead.id}`
- `src/components/hunts/hunt-card.tsx:98,225` — `/hunts/${hunt.id}/edit`
- `src/actions/team.actions.ts:31,62` — `revalidatePath("/settings")`
- `src/actions/message.actions.ts:86,126,214` — `revalidatePath("/templates")`
- `src/actions/lead.actions.ts:47,89,160,201,246,296,325` — `revalidatePath("/leads")` and `revalidatePath("/leads/${leadId}")`
- `src/actions/account.actions.ts:33` — `revalidatePath("/settings")`
- `src/services/message.service.ts:222` — `revalidatePath("/leads/${leadId}")`
- `src/lib/seo-examples.ts` — various hardcoded routes

Create a checklist document or tracking list of all occurrences to guide replacement in subsequent tasks.

**Test Strategy:**

Verify completeness by running the same grep searches after creating the audit list and confirming every match is documented. Cross-reference with the App Router page structure (`src/app/**/page.tsx`) to ensure no routes are missed.
