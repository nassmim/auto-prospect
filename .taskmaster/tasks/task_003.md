# Task ID: 3

**Title:** Extend Ads Schema into Leads with Pipeline Stages

**Status:** done

**Dependencies:** 1 ✓, 2 ✓

**Priority:** high

**Description:** Extend the existing ads table with lead-specific fields (stage, assignment, source hunt) or create a separate leads table that references ads. This enables the Kanban pipeline functionality.

**Details:**

Create `src/schema/lead.schema.ts` (separate from raw ads for clean separation):

1. **leads table:**
   - `id`: uuid, primary key, default random
   - `organizationId`: uuid, FK to organizations.id
   - `huntId`: uuid, FK to hunts.id (source hunt)
   - `adId`: uuid, FK to ads.id (the scraped listing data)
   - `stage`: varchar enum ('nouveau', 'contacte', 'relance', 'negociation', 'gagne', 'perdu'), default 'nouveau'
   - `assignedToId`: uuid, FK to accounts.id, nullable
   - `position`: integer (for ordering within stage)
   - `createdAt`: timestamp, default now
   - `updatedAt`: timestamp, default now
   - Unique constraint on (organizationId, adId) - prevent duplicate leads
   - Index on (organizationId, stage) for Kanban queries
   - Index on (organizationId, assignedToId) for user filtering
   - RLS: org members can access, with visibility restriction option

2. **lead_notes table:**
   - `id`: uuid, primary key
   - `leadId`: uuid, FK to leads.id, on delete cascade
   - `content`: text
   - `createdById`: uuid, FK to accounts.id
   - `createdAt`: timestamp
   - RLS: org members can CRUD

3. **lead_reminders table:**
   - `id`: uuid, primary key
   - `leadId`: uuid, FK to leads.id, on delete cascade
   - `dueAt`: timestamp
   - `note`: text nullable
   - `completed`: boolean, default false
   - `createdById`: uuid, FK to accounts.id
   - RLS: org members can CRUD

**Test Strategy:**

1. Create lead from existing ad, verify FK relationship. 2. Test stage transitions update `updatedAt`. 3. Test duplicate prevention (same ad + org). 4. Verify Kanban query performance with explain analyze on stage index.

## Subtasks

### 3.1. Create leads table schema with stage enum and FK relationships

**Status:** done  
**Dependencies:** None  

Define the leads pgTable in src/schema/lead.schema.ts with all required fields: id, organizationId, huntId, adId, stage enum, assignedToId, position, timestamps, and foreign key relationships to organizations, hunts, ads, and accounts tables.

**Details:**

Create `src/schema/lead.schema.ts` with:
1. Export lead stage enum type: `leadStages = ['nouveau', 'contacte', 'relance', 'negociation', 'gagne', 'perdu'] as const`
2. Define `leads` pgTable with columns:
   - `id`: uuid().primaryKey().notNull().default(sql`gen_random_uuid()`)
   - `organizationId`: uuid('organization_id').notNull()
   - `huntId`: uuid('hunt_id').notNull()
   - `adId`: uuid('ad_id').notNull()
   - `stage`: varchar({ length: 20 }).notNull().default('nouveau')
   - `assignedToId`: uuid('assigned_to_id')
   - `position`: integer().notNull().default(0)
   - `createdAt`/`updatedAt`: timestamp with timezone, defaults
3. Add foreign keys using foreignKey() helper with onDelete cascade for org/hunt/ad, set null for assignedTo
4. Import required dependencies from drizzle-orm/pg-core and reference existing tables from organization.schema, hunt.schema, ad.schema, account.schema

### 3.2. Add unique constraint and performance indexes to leads table

**Status:** done  
**Dependencies:** 3.1  

Add the unique constraint on (organizationId, adId) to prevent duplicate leads, plus composite indexes for Kanban stage queries and user assignment filtering.

**Details:**

In the leads table third argument (constraints/indexes function), add:
1. `unique('leads_org_ad_unique').on(table.organizationId, table.adId)` - Prevents same ad being added as lead twice in same org
2. `index('leads_organization_stage_idx').on(table.organizationId, table.stage)` - Critical for Kanban column queries
3. `index('leads_organization_assigned_idx').on(table.organizationId, table.assignedToId)` - For filtering leads by team member
4. `index('leads_hunt_id_idx').on(table.huntId)` - For querying leads by source hunt
5. Consider partial index for active stages if needed later for performance

### 3.3. Implement RLS policies for leads table with org member access

**Status:** done  
**Dependencies:** 3.1  

Add Row Level Security policies to leads table ensuring only organization members can access leads, following the existing pattern from hunts table with joined_at verification.

**Details:**

Add to leads table constraints:
1. Enable RLS with pgPolicy for 'all' operations to authenticatedRole
2. Using clause: `sql\`exists (select 1 from organization_members om where om.organization_id = ${table.organizationId} and om.account_id = ${authUid} and om.joined_at is not null)\``
3. WithCheck clause: same subquery for insert/update validation
4. Import authenticatedRole, authUid from drizzle-orm/supabase
5. After migration generation, manually add to SQL: `grant select, insert, update, delete on table public.leads to authenticated, service_role;`
6. Ensure migration includes `ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;`

### 3.4. Create lead_notes and lead_reminders tables with cascading FK

**Status:** done  
**Dependencies:** 3.1  

Define supporting tables for lead collaboration: lead_notes for text annotations and lead_reminders for follow-up scheduling, both with cascade delete from parent lead.

**Details:**

In src/schema/lead.schema.ts, add two more pgTables:

**lead_notes:**
- `id`: uuid().primaryKey().default(sql`gen_random_uuid()`)
- `leadId`: uuid('lead_id').notNull() with FK to leads.id onDelete cascade
- `content`: text().notNull()
- `createdById`: uuid('created_by_id').notNull() with FK to accounts.id
- `createdAt`: timestamp with default now()
- RLS: org members can CRUD (join through leads to organization_members)

**lead_reminders:**
- `id`: uuid().primaryKey().default(sql`gen_random_uuid()`)
- `leadId`: uuid('lead_id').notNull() with FK to leads.id onDelete cascade
- `dueAt`: timestamp with timezone, notNull
- `note`: text()
- `completed`: boolean().default(false).notNull()
- `createdById`: uuid('created_by_id').notNull() with FK to accounts.id
- `createdAt`: timestamp with default now()
- RLS: org members via leads join, index on (leadId, completed, dueAt)

### 3.5. Add Drizzle relations and export schema from index

**Status:** done  
**Dependencies:** 3.1, 3.4  

Define Drizzle ORM relations for leads, lead_notes, and lead_reminders tables to enable typed eager loading, then export all new schemas from src/schema/index.ts.

**Details:**

1. Add relations in lead.schema.ts:
```typescript
export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, { fields: [leads.organizationId], references: [organizations.id] }),
  hunt: one(hunts, { fields: [leads.huntId], references: [hunts.id] }),
  ad: one(ads, { fields: [leads.adId], references: [ads.id] }),
  assignedTo: one(accounts, { fields: [leads.assignedToId], references: [accounts.id] }),
  notes: many(leadNotes),
  reminders: many(leadReminders),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, { fields: [leadNotes.leadId], references: [leads.id] }),
  createdBy: one(accounts, { fields: [leadNotes.createdById], references: [accounts.id] }),
}));

export const leadRemindersRelations = relations(leadReminders, ...);
```
2. Update src/schema/index.ts: add `export * from '@/schema/lead.schema';`
3. Run pnpm db:generate to produce final migration
