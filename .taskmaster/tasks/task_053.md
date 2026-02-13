# Task ID: 53

**Title:** Migrate OutreachSettings and LeadDrawer from useEffect Data Fetching to Server-Passed Props

**Status:** done

**Dependencies:** 48 ✓, 52 ✓

**Priority:** medium

**Description:** Two client components (outreach-settings.tsx and lead-drawer.tsx) fetch data via useEffect. Refactor to receive data from parent Server Components via props.

**Details:**

Two components use the useEffect anti-pattern for data fetching:

### 1. OutreachSettings (`src/components/hunts/outreach-settings.tsx`)
- **Current**: Calls `getAccountTemplates()` service in useEffect on mount (line 52-64)
- **Fix**: The parent page (hunt edit or hunt create) should fetch templates server-side and pass them as props:
  ```typescript
  // In parent Server Component (edit-hunt page or new-hunt page)
  const templates = await getAccountTemplates();
  return <HuntForm templates={templates} ... />;
  ```
  Then `HuntForm` passes `templates` to `OutreachSettings` as a prop.
- Remove the useEffect, useState for templates, and isLoading state.
- The `getAccountTemplates()` import from `message.service.ts` should move to the parent server component.

### 2. LeadDrawer (`src/components/leads/lead-drawer.tsx`)
- **Current**: Calls `getLeadDetails(leadId)` and `getteamMembers()` in useEffect (lines 94-130)
- **This is more nuanced**: The drawer opens dynamically when a user clicks a lead card. The lead ID changes at runtime.
- **Fix options**:
  a. **Server Action approach**: Keep client component but use server actions with `useTransition` instead of raw useEffect + service calls.
  b. **Parallel route/intercepting route**: Use Next.js intercepting routes for the drawer pattern.
  c. **Accept current pattern**: If the drawer is truly dynamic (opens on click, different leads), client-side fetching via server actions is acceptable. Refactor to use proper server actions instead of directly calling service functions.
- Ensure `getLeadDetails` and `getteamMembers` are called through server actions, not imported service functions directly in client code.

**Important**: The lead drawer's pattern is a legitimate case for client-triggered server calls since the data depends on user interaction. Refactor to use server actions properly rather than forcing all data to be pre-fetched.

**Test Strategy:**

Open the hunt creation/edit form. Verify outreach settings load templates without a loading spinner (since data is pre-fetched). Open a lead drawer by clicking a lead card. Verify lead details load correctly. Test switching between different leads in the drawer. Verify no useEffect imports remain for data fetching purposes.
