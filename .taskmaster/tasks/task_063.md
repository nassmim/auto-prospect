# Task ID: 63

**Title:** Replace hardcoded revalidatePath calls in server actions and services

**Status:** done

**Dependencies:** 58 ✓

**Priority:** high

**Description:** Replace all hardcoded route strings in `revalidatePath()` calls across server actions and services with `pages` config references.

**Details:**

Files and changes:

1. **`src/actions/team.actions.ts`** (lines 31, 62):
   - `revalidatePath("/settings")` → `revalidatePath(pages.settings)`
   - Add import: `import { pages } from "@/config/routes"`

2. **`src/actions/account.actions.ts`** (line 33):
   - `revalidatePath("/settings")` → `revalidatePath(pages.settings)`
   - Add import

3. **`src/actions/message.actions.ts`** (lines 86, 126, 214):
   - `revalidatePath("/templates")` → `revalidatePath(pages.templates.list)`
   - Add import

4. **`src/actions/lead.actions.ts`** (lines 47, 89, 160, 201, 325):
   - `revalidatePath("/leads")` → `revalidatePath(pages.leads.list)`
   - Lines 246, 296: `revalidatePath(\`/leads/${leadId}\`)` → `revalidatePath(pages.leads.detail(leadId))`
   - Add import

5. **`src/services/message.service.ts`** (line 222):
   - `revalidatePath(\`/leads/${leadId}\`)` → `revalidatePath(pages.leads.detail(leadId))`
   - Add import

Note: `revalidatePath` accepts a string, and `pages.leads.detail(leadId)` returns a string, so this works directly.

**Test Strategy:**

1. Trigger each server action that calls revalidatePath and verify the page revalidates correctly:
   - Update team settings → settings page revalidates
   - Create/update/delete template → templates page revalidates
   - Create/update/delete lead → leads list and detail pages revalidate
2. Run `pnpm build` to verify no type errors
3. Grep for remaining hardcoded `revalidatePath` calls to confirm none remain
