import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { organizations } from "./organization.schema";
import { baseFilters } from "./filter.schema";
import { ads } from "./ad.schema";
import { accounts } from "./account.schema";

// Lead stage enum - pipeline stages for the Kanban view
export const leadStages = [
  "nouveau",
  "contacte",
  "relance",
  "negociation",
  "gagne",
  "perdu",
] as const;
export type LeadStage = (typeof leadStages)[number];

// Leads table - connects ads to organizations with pipeline tracking
export const leads = pgTable(
  "leads",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    huntId: uuid("hunt_id").notNull(), // References baseFilters (hunts)
    adId: uuid("ad_id").notNull(),
    stage: varchar({ length: 20 }).notNull().default("nouveau"),
    assignedToId: uuid("assigned_to_id"),
    position: integer().notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Foreign key constraints with cascading deletes
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "leads_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.huntId],
      foreignColumns: [baseFilters.id],
      name: "leads_hunt_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.adId],
      foreignColumns: [ads.id],
      name: "leads_ad_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assignedToId],
      foreignColumns: [accounts.id],
      name: "leads_assigned_to_id_fk",
    }).onDelete("set null"),
    // Prevent duplicate leads for the same ad in an organization
    unique("leads_organization_id_ad_id_key").on(
      table.organizationId,
      table.adId,
    ),
    // Performance indexes for Kanban queries
    index("leads_organization_id_stage_idx").on(
      table.organizationId,
      table.stage,
    ),
    index("leads_organization_id_assigned_to_id_idx").on(
      table.organizationId,
      table.assignedToId,
    ),
    index("leads_hunt_id_idx").on(table.huntId),
    index("leads_ad_id_idx").on(table.adId),
    // RLS: Organization members can access all leads in their org
    pgPolicy("enable all for organization members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
  ],
);

// Lead notes table - activity log and notes for each lead
export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id").notNull(),
    content: text().notNull(),
    createdById: uuid("created_by_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "lead_notes_lead_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "lead_notes_created_by_id_fk",
    }).onDelete("cascade"),
    index("lead_notes_lead_id_idx").on(table.leadId),
    index("lead_notes_created_by_id_idx").on(table.createdById),
    // RLS: Org members can CRUD notes on leads they can access
    pgPolicy("enable all for organization members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = ${table.leadId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = ${table.leadId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
  ],
);

// Lead reminders table - follow-up reminders for leads
export const leadReminders = pgTable(
  "lead_reminders",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    note: text(),
    completed: boolean().notNull().default(false),
    createdById: uuid("created_by_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "lead_reminders_lead_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "lead_reminders_created_by_id_fk",
    }).onDelete("cascade"),
    index("lead_reminders_lead_id_idx").on(table.leadId),
    index("lead_reminders_due_at_idx").on(table.dueAt),
    index("lead_reminders_created_by_id_idx").on(table.createdById),
    // RLS: Org members can CRUD reminders on leads they can access
    pgPolicy("enable all for organization members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = ${table.leadId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = ${table.leadId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
  ],
);

// Relations for type-safe joins
export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leads.organizationId],
    references: [organizations.id],
  }),
  hunt: one(baseFilters, {
    fields: [leads.huntId],
    references: [baseFilters.id],
  }),
  ad: one(ads, {
    fields: [leads.adId],
    references: [ads.id],
  }),
  assignedTo: one(accounts, {
    fields: [leads.assignedToId],
    references: [accounts.id],
  }),
  notes: many(leadNotes),
  reminders: many(leadReminders),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
  createdBy: one(accounts, {
    fields: [leadNotes.createdById],
    references: [accounts.id],
  }),
}));

export const leadRemindersRelations = relations(leadReminders, ({ one }) => ({
  lead: one(leads, {
    fields: [leadReminders.leadId],
    references: [leads.id],
  }),
  createdBy: one(accounts, {
    fields: [leadReminders.createdById],
    references: [accounts.id],
  }),
}));
