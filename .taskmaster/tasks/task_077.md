# Task ID: 77

**Title:** Validate Security Model for All SWR Migrations

**Status:** done

**Dependencies:** 71 ✓, 72 ✓, 73 ✓, 74 ✓, 75 ✓

**Priority:** high

**Description:** Audit all new server action fetcher wrappers and SWR-powered client components to ensure RLS enforcement, authentication checks, and no data leakage.

**Details:**

Security audit checklist for every migrated component:

1. **Server Action Authentication**: Verify every fetcher wrapper in `src/actions/` calls `createClient()` → `getSession()` and throws 'Unauthorized' if no session. Check: `fetchDashboardStats`, `fetchActiveHunts`, `fetchLeadDetails`, `fetchTeamMembers`, `fetchPipelineLeads`, `fetchAccountCredits`, `fetchAccountHunts`.

2. **RLS Enforcement**: Verify all underlying services use `dbClient.rls()` wrapper (not `dbClient.admin`). Cross-reference each service function called by the new action wrappers.

3. **No Admin Data Exposure**: Ensure no server action wrapper uses `dbClient.admin` mode. Grep for `.admin` usage in all action files.

4. **Input Validation**: Verify parameterized fetchers validate inputs (e.g., `fetchLeadDetails(leadId)` should validate leadId is a valid UUID format via Zod before querying).

5. **Client-Side Data Handling**: Ensure no sensitive fields are exposed in SWR cached data that shouldn't be visible to the current user. Check that RLS policies filter correctly.

6. **Cross-User Test**: Attempt to fetch another user's lead details, dashboard stats, etc. via the server actions — verify RLS blocks access.

7. **No Credential Leakage**: Ensure no API keys, tokens, or internal IDs leak through SWR error messages or cached data.

**Test Strategy:**

For each server action fetcher: (1) Call without auth session → expect 'Unauthorized' error. (2) Call with valid session but requesting another account's data → expect empty result or RLS error. (3) Verify dbClient.rls() is used in all underlying service calls (grep for .admin usage). (4) Test with browser DevTools Network tab that no sensitive data appears in client responses. Document findings in a security checklist.
