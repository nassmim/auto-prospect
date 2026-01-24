# Task ID: 9

**Title:** Build Leads Pipeline with Kanban and List Views

**Status:** done

**Dependencies:** 3 ✓, 7 ✓

**Priority:** high

**Description:** Implement the leads CRM view with draggable Kanban board (Nouveau/Contacté/Relance/Négociation/Gagné/Perdu) and table list view. Reference: 02-crm-kanban-view.png

**Details:**

Create pipeline in `src/app/(app)/leads/page.tsx`:

1. **View Toggle (Client Component):**
   - Tab buttons: Kanban | Liste
   - Persist preference in localStorage or URL param

2. **Filter Bar:**
   - Hunt dropdown (filter by source hunt)
   - Assigned user dropdown (filter by assignee)
   - Date range picker (createdAt filter)
   - Search input (search vehicle title/description)
   - Filters update URL search params for shareable views

3. **Kanban View:**
   - 6 columns matching stages: nouveau, contacte, relance, negociation, gagne, perdu
   - Drag-and-drop between columns (use @dnd-kit or react-beautiful-dnd)
   - Lead cards show: thumbnail, title, price, location, phone badge, platform badge
   - On drop: update lead stage via Server Action, log activity
   - Optimistic UI update for smooth DX

4. **List View:**
   - Table with sortable columns: vehicle, price, location, stage (dropdown), assigned, date
   - Checkbox for bulk selection
   - Bulk actions: change stage, assign to user
   - Pagination with page size options

5. **Lead Card Component:**
   - `src/components/leads/lead-card.tsx`
   - Click opens Lead Detail Drawer (Task 10)
   - Show WhatsApp/phone icon if has phone number

6. **Server Actions:**
   - `updateLeadStage(leadId, newStage)` - updates stage, logs activity
   - `bulkUpdateLeads(leadIds, updates)` - batch operations

**Test Strategy:**

1. Drag lead between stages, verify DB update and optimistic UI. 2. Apply filters, verify correct leads shown. 3. Sort table by price, verify ordering. 4. Bulk select and update, verify all records changed.

## Subtasks

### 9.1. Create Leads Page Foundation with View Toggle and Filter Bar

**Status:** done  
**Dependencies:** None  

Build the main leads page at `src/app/(app)/leads/page.tsx` with a Server Component for data fetching and a Client Component for view toggle (Kanban/Liste) and filter bar. Install @dnd-kit packages for drag-and-drop functionality.

**Details:**

1. Install @dnd-kit/core and @dnd-kit/sortable packages via pnpm. 2. Create `src/app/(app)/leads/page.tsx` as Server Component that fetches leads with relations (ad, hunt, assignedTo) using `createDrizzleSupabaseClient()`. 3. Create `src/components/leads/leads-page-client.tsx` as Client Component containing: (a) View toggle tabs (Kanban | Liste) using URL search params (`?view=kanban|list`) with useSearchParams hook; (b) Filter bar with: Hunt dropdown (fetched from server), Assigned user dropdown (org members), Date range picker (createdAt), Search input (vehicle title). 4. Filters should update URL search params for shareable/bookmarkable views. 5. Update sidebar navigation href from `/pipeline` to `/leads` to match the actual route.

### 9.2. Build Kanban View with Drag-and-Drop Columns

**Status:** done  
**Dependencies:** 9.1  

Implement the Kanban board view with 6 columns (nouveau, contacte, relance, negociation, gagne, perdu) using @dnd-kit library. Include drag-and-drop functionality between columns with optimistic UI updates.

**Details:**

1. Create `src/components/leads/kanban-view.tsx` Client Component using @dnd-kit/core DndContext and @dnd-kit/sortable SortableContext. 2. Create `src/components/leads/kanban-column.tsx` for each stage column with: (a) Column header showing stage name (French labels: Nouveau, Contacté, Relance, Négociation, Gagné, Perdu) and lead count; (b) Droppable area using useDroppable hook; (c) Visual feedback during drag (border highlight). 3. Implement onDragEnd handler that: (a) Identifies source and target columns; (b) Performs optimistic UI update using React state; (c) Calls updateLeadStage Server Action (Task 5); (d) Reverts on error with toast notification. 4. Use `position` field from leads schema for ordering within columns. 5. Style with dark theme matching existing design (zinc-800 borders, amber-500 accents).

### 9.3. Build Lead Card Component for Kanban and List Views

**Status:** done  
**Dependencies:** 9.1  

Create a reusable LeadCard component displaying thumbnail, title, price, location, phone badge, and platform badge. Card click should be wired for Lead Detail Drawer integration (Task 10).

**Details:**

1. Create `src/components/leads/lead-card.tsx` as Client Component with props: lead data (with ad relation), onSelect callback, isDragging state. 2. Card layout showing: (a) Thumbnail from ad.picture with fallback placeholder; (b) Vehicle title (ad.title) truncated to 2 lines; (c) Price formatted as EUR with French locale; (d) Location from ad.zipcode relation; (e) Phone badge (green icon if ad.hasPhone && ad.phoneNumber); (f) WhatsApp badge (amber icon if ad.isWhatsappPhone); (g) Platform badge based on ad URL domain detection (Leboncoin logo/text). 3. Wrap in @dnd-kit useSortable for Kanban draggable support. 4. onClick triggers onSelect callback passing lead ID for drawer opening. 5. Visual states: hover (subtle border glow), dragging (opacity reduced, shadow), selected (amber border). 6. Show stage badge as colored dot matching column color scheme.

### 9.4. Build List View with Sortable Table and Bulk Actions

**Status:** done  
**Dependencies:** 9.1, 9.3  

Implement the table list view with sortable columns, checkbox selection for bulk operations, and pagination. Include inline stage dropdown and assign user dropdown per row.

**Details:**

1. Create `src/components/leads/list-view.tsx` Client Component with table structure. 2. Table columns: (a) Checkbox for selection (header checkbox for select all); (b) Vehicle (thumbnail + title from LeadCard component); (c) Price (sortable, formatted EUR); (d) Location (zipcode.name); (e) Stage (dropdown select inline, calls updateLeadStage on change); (f) Assigned (dropdown with org members, calls assignLead action); (g) Date (createdAt formatted, sortable). 3. Sorting: Click column header to toggle sort direction, update URL params (?sort=price&dir=asc). 4. Bulk actions bar (appears when selection > 0): (a) Change stage dropdown; (b) Assign to user dropdown; (c) Selection count display. 5. Pagination component at bottom: page size options (10, 25, 50), page navigation, total count. 6. Use URL params for pagination (?page=1&pageSize=25). 7. Style table with zinc-800 borders, alternating row backgrounds, hover states.

### 9.5. Create Server Actions for Lead Stage Updates and Bulk Operations

**Status:** done  
**Dependencies:** None  

Implement Server Actions for updateLeadStage, bulkUpdateLeads, and assignLead operations. Include activity logging to lead_notes table for audit trail.

**Details:**

1. Create `src/app/(app)/leads/actions.ts` with 'use server' directive. 2. Implement `updateLeadStage(leadId: string, newStage: LeadStage)`: (a) Validate stage is valid using leadStages array from schema; (b) Get current user via createDrizzleSupabaseClient(); (c) Update lead record with new stage and updatedAt; (d) Insert activity note: 'Stage changé de {oldStage} à {newStage}' with createdById; (e) Revalidate /leads path. 3. Implement `bulkUpdateLeads(leadIds: string[], updates: { stage?: LeadStage, assignedToId?: string })`: (a) Validate all inputs; (b) Update all leads in transaction; (c) Log activity for each lead; (d) Revalidate path. 4. Implement `assignLead(leadId: string, assignedToId: string | null)`: (a) Update lead.assignedToId; (b) Log activity note; (c) Revalidate. 5. Implement `getLeadsWithFilters(filters: LeadFilters)` for server-side filtering supporting: huntId, assignedToId, dateRange, search, stage, sort, pagination. 6. Use Drizzle type-safe queries with RLS enforced via createDrizzleSupabaseClient().
