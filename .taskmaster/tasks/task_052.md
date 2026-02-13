# Task ID: 52

**Title:** Migrate Leads Page from Client-Side Placeholder to Server Component Data Fetching

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** The leads page renders a client component (LeadsPageClient) with TODO placeholders instead of real data. Refactor to fetch leads server-side and pass to the view components.

**Details:**

The leads page currently delegates everything to `LeadsPageClient` which shows placeholder text:

1. **Current state**: `leads/page.tsx` just renders `<LeadsPageClient />` which is a client component with TODO placeholders for both Kanban and List views.

2. **Services exist**: `lead.service.ts` has functions for fetching leads but no function to get all leads for the pipeline view. Need to create one.

3. **Refactor approach**:
   a. Create `getLeadsByStage()` or `getPipelineLeads()` in `lead.service.ts` that fetches leads grouped by pipeline stage for the account.
   b. Update `leads/page.tsx` to be a proper Server Component:
   ```typescript
   export default async function LeadsPage() {
     const leads = await getPipelineLeads();
     return <LeadsPageView leads={leads} />;
   }
   ```
   c. Refactor `LeadsPageClient` to accept leads as props instead of fetching them.
   d. Pass leads data down to existing `KanbanView` and `ListView` components.

4. **Lead schema reference**: Check `src/schema/lead.schema.ts` for the lead pipeline stages enum to understand grouping.

5. The `KanbanView` and `ListView` components in `src/components/leads/` likely expect typed lead arrays — match the service return type to their props.

6. Implement proper URL-based filtering using `searchParams` in the Server Component for the filter state (currently `LeadsFilters` uses `useRouter` for client-side filtering).

**Test Strategy:**

Load the leads page. Verify the Kanban view shows real leads grouped by pipeline stage. Switch to List view and verify leads display in a table format. Test filtering with the LeadsFilters component. Verify lead cards are clickable and open the lead drawer. Test with zero leads (empty state).

## Subtasks

### 52.1. Analyze lead schema pipeline stages and design getPipelineLeads service query

**Status:** done  
**Dependencies:** None  

Study the lead.schema.ts pipeline stages enum (ELeadStage in constants/enums.ts: nouveau, contacte, relance, gagne, perdu) and design the getPipelineLeads service function signature and return type that groups leads by stage for both KanbanView and ListView consumption.

**Details:**

1. Review `src/constants/enums.ts` for `ELeadStage` enum values (nouveau, contacte, relance, gagne, perdu). Note KanbanView also uses 'negociation' column — verify if this is in the enum or hardcoded.
2. Ensure `leadStages` array and `LeadStage` type are properly exported from `src/schema/lead.schema.ts` — multiple components import these but they may not exist yet.
3. Design the return type to satisfy BOTH component prop interfaces:
   - KanbanView expects: `{ id, stage, position, ad: { title, price, picture, phoneNumber, isWhatsappPhone, zipcode: { name } } }`
   - ListView expects: `{ id, stage, assignedToId, createdAt, ad: { title, price, phoneNumber, zipcode: { name } }, assignedTo: { name } | null }`
4. Design a unified `PipelineLead` type that covers both views' needs (superset of both interfaces).
5. Plan the query shape: fetch from `leads` table with relations to `ads` (including `zipcode`), `assignedTo` user, filtered by accountId, ordered by position within each stage.
6. Define the filter parameters the service should accept: `huntId?: string`, `assignedToId?: string | 'unassigned'`, `searchQuery?: string`.

### 52.2. Implement getPipelineLeads service with Drizzle ORM and RLS wrapper

**Status:** done  
**Dependencies:** 52.1  

Create the getPipelineLeads function in lead.service.ts that fetches leads with related ad data, assignee info, and zipcode using Drizzle relational queries through the RLS client wrapper.

**Details:**

1. Add `getPipelineLeads(filters?)` to `src/services/lead.service.ts` using Pattern 3 (RLS Only) from CLAUDE.md since this is always user-triggered.
2. Use Drizzle relational query API (`dbClient.rls((tx) => tx.query.leads.findMany({...}))`) with:
   - `with: { ad: { with: { zipcode: true } }, assignedTo: true }` for relations
   - `where` clause filtering by accountId (from auth), optional huntId, optional assignedToId
   - `orderBy: [asc(leads.stage), asc(leads.position)]` for Kanban ordering
3. For search filter (`q` param), add a `like` condition on the related ad title field — this may require a subquery or post-filter depending on Drizzle's relational query capabilities.
4. Handle the 'unassigned' filter case: `isNull(leads.assignedToId)` when assignedToId === 'unassigned', or `eq(leads.assignedToId, userId)` for specific user.
5. Export the return type: `export type PipelineLead = Awaited<ReturnType<typeof getPipelineLeads>>[number]`.
6. Verify the query respects RLS by using the rls wrapper — user's JWT auth.uid() ensures they only see their account's leads.

### 52.3. Refactor LeadsPageClient to accept leads as props instead of placeholder

**Status:** done  
**Dependencies:** 52.1  

Transform LeadsPageClient from a standalone client component with TODO placeholders into a presentational component (LeadsPageView) that receives leads data as props and passes them to KanbanView and ListView.

**Details:**

1. Rename or refactor `src/app/(app)/leads/leads-page-client.tsx` to become a view component that accepts props.
2. Update the component signature:
   ```typescript
   type LeadsPageViewProps = {
     initialLeads: PipelineLead[];
   };
   export function LeadsPageView({ initialLeads }: LeadsPageViewProps) { ... }
   ```
3. Replace the placeholder text blocks (lines 53-56 for Kanban, lines 59-64 for List) with actual component rendering:
   - Kanban mode: `<KanbanView initialLeads={initialLeads} />`
   - List mode: `<ListView initialLeads={initialLeads} />`
4. Keep the view mode toggle (Kanban/List) state management — this is client-side UI state and belongs here.
5. Keep the `LeadsFilters` component rendering as-is (it already uses URL searchParams).
6. Remove any unused imports and the TODO comment placeholders.
7. The component should remain a client component (`'use client'`) since it manages view toggle state and renders interactive children.

### 52.4. Update leads/page.tsx Server Component to fetch and pass data

**Status:** done  
**Dependencies:** 52.2, 52.3  

Convert the leads page.tsx into a proper async Server Component that calls getPipelineLeads with searchParams-based filters and passes the result to LeadsPageView.

**Details:**

1. Update `src/app/(app)/leads/page.tsx` to be an async Server Component:
   ```typescript
   import { getPipelineLeads } from '@/services/lead.service';
   import { LeadsPageView } from './leads-page-view'; // or updated name

   type LeadsPageProps = {
     searchParams: Promise<{ hunt?: string; assigned?: string; q?: string }>;
   };

   export default async function LeadsPage({ searchParams }: LeadsPageProps) {
     const params = await searchParams; // Next.js 16 async searchParams
     const leads = await getPipelineLeads({
       huntId: params.hunt,
       assignedToId: params.assigned,
       searchQuery: params.q,
     });
     return <LeadsPageView initialLeads={leads} />;
   }
   ```
2. Note: In Next.js 15+, `searchParams` is a Promise that must be awaited.
3. Pass the resolved filter params to `getPipelineLeads` service.
4. Keep the page thin — only data fetching and delegation to view component per project conventions.
5. Remove the direct `<LeadsPageClient />` import if it was renamed.

### 52.5. Wire leads data into KanbanView and ListView with proper TypeScript types

**Status:** done  
**Dependencies:** 52.2, 52.3  

Ensure KanbanView and ListView components correctly receive and render the PipelineLead data from the service, updating type definitions if the service return shape differs from current inline types.

**Details:**

1. Compare the `PipelineLead` type from the service with KanbanView's expected `Lead` type:
   - KanbanView needs: `id, stage, position, ad.title, ad.price, ad.picture, ad.phoneNumber, ad.isWhatsappPhone, ad.zipcode.name`
   - If the service returns more fields, that's fine (superset). If it returns fewer or differently named fields, update the service query.
2. Compare with ListView's expected `Lead` type:
   - ListView needs: `id, stage, assignedToId, createdAt, ad.title, ad.price, ad.phoneNumber, ad.zipcode.name, assignedTo.name`
3. Update component type imports to use `PipelineLead` from the service instead of inline types, OR keep inline types if they serve as a narrower contract.
4. Verify KanbanView's stage columns match the actual enum values — it currently renders 6 columns including 'negociation' which may not be in ELeadStage.
5. Test that drag-and-drop in KanbanView still works with the new data shape (calls `updateLeadStage` action).
6. Test that ListView's sorting and bulk selection work with the new data shape.

### 52.6. Implement URL searchParams-based filtering in Server Component replacing client-side approach

**Status:** pending  
**Dependencies:** 52.4, 52.5  

Ensure the LeadsFilters component's URL parameter updates trigger server-side re-fetching via Next.js searchParams, replacing any client-side-only filtering with the server-driven approach where filters flow through page.tsx searchParams to the service query.

**Details:**

1. Review `src/components/leads/leads-filters.tsx` — it already uses `useSearchParams` and `useRouter` to update URL params. This is the correct pattern for triggering server re-renders in Next.js App Router.
2. Verify the filter parameter names match what page.tsx reads: `hunt`, `assigned`, `q`.
3. The flow should be: LeadsFilters updates URL → Next.js re-renders page.tsx Server Component → new searchParams → getPipelineLeads called with new filters → fresh data passed to view.
4. Populate the hunt dropdown in LeadsFilters with real hunt data. This may require:
   - Fetching hunts in page.tsx and passing them as a prop to LeadsPageView/LeadsFilters
   - Or creating a lightweight `getAccountHunts()` call in the page
5. Populate the assigned user dropdown with real team members (may need a `getTeamMembers()` service call in page.tsx).
6. Test that applying/clearing filters updates the URL and the page re-renders with filtered data.
7. Ensure `router.replace` (not `router.push`) is used in LeadsFilters to avoid polluting browser history with filter changes.
8. Handle the 'me' filter value for assigned — the server needs to resolve 'me' to the current user's ID in getPipelineLeads or in page.tsx before calling the service.
