import { ELeadStage } from "@/constants/enums";
import { InferInsertModel, relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { ads } from "./ad.schema";
import { hunts } from "./hunt.schema";
import { organizationMembers, organizations } from "./organization.schema";

// Lead stage enum - pipeline stages for the Kanban view
export const leadStage = pgEnum(
  "lead_stage",
  Object.values(ELeadStage) as [string, ...string[]],
);
export type LeadStage = (typeof ELeadStage)[keyof typeof ELeadStage];

// Leads table - connects ads to organizations with pipeline tracking
export const leads = pgTable(
  "leads",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    huntId: uuid("hunt_id")
      .references(() => hunts.id, { onDelete: "cascade" })
      .notNull(),
    adId: uuid("ad_id")
      .references(() => ads.id, { onDelete: "cascade" })
      .notNull(),
    stage: leadStage().notNull().default(ELeadStage.NOUVEAU),
    assignedToId: uuid("assigned_to_id").references(
      () => organizationMembers.id,
      { onDelete: "set null" },
    ),
    position: integer().notNull().default(0),
    notes: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
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
    pgPolicy("enable all for owners of the associated organization", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
            select 1 from organizations o
            where o.id = ${table.organizationId}
            and o.auth_user_id = ${authUid}
          )`,
      withCheck: sql`exists (
            select 1 from organizations o
            where o.id = ${table.organizationId}
            and o.auth_user_id = ${authUid}
          )`,
    }),
    // // RLS: Organization members can access all leads in their org
    // pgPolicy("enable all for organization members", {
    //   as: "permissive",
    //   for: "all",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and om.member_organization_id in (
    //       select id from organizations where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and om.member_organization_id in (
    //       select id from organizations where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
  ],
);
export type TLeadInsert = InferInsertModel<typeof leads>;

// // Lead notes table - activity log and notes for each lead
// export const leadNotes = pgTable(
//   "lead_notes",
//   {
//     id: uuid()
//       .primaryKey()
//       .notNull()
//       .default(sql`gen_random_uuid()`),
//     leadId: uuid("lead_id").notNull(),
//     content: text().notNull(),
//     createdById: uuid("created_by_id").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true })
//       .notNull()
//       .default(sql`now()`),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.leadId],
//       foreignColumns: [leads.id],
//       name: "lead_notes_lead_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.createdById],
//       foreignColumns: [organizations.id],
//       name: "lead_notes_created_by_id_fk",
//     }).onDelete("cascade"),
//     index("lead_notes_lead_id_idx").on(table.leadId),
//     index("lead_notes_created_by_id_idx").on(table.createdById),
//     // RLS: Org members can CRUD notes on leads they can access
//     pgPolicy("enable all for organization members", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`exists (
//         select 1 from leads l
//         join organization_members om on om.organization_id = l.organization_id
//         where l.id = ${table.leadId}
//         and om.member_organization_id in (
//           select id from organizations where auth_user_id = ${authUid}
//         )
//         and om.joined_at is not null
//       )`,
//       withCheck: sql`exists (
//         select 1 from leads l
//         join organization_members om on om.organization_id = l.organization_id
//         where l.id = ${table.leadId}
//         and om.member_organization_id in (
//           select id from organizations where auth_user_id = ${authUid}
//         )
//         and om.joined_at is not null
//       )`,
//     }),
//   ],
// );

// // Lead reminders table - follow-up reminders for leads
// export const leadReminders = pgTable(
//   "lead_reminders",
//   {
//     id: uuid()
//       .primaryKey()
//       .notNull()
//       .default(sql`gen_random_uuid()`),
//     leadId: uuid("lead_id").notNull(),
//     dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
//     note: text(),
//     completed: boolean().notNull().default(false),
//     createdById: uuid("created_by_id").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true })
//       .notNull()
//       .default(sql`now()`),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.leadId],
//       foreignColumns: [leads.id],
//       name: "lead_reminders_lead_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.createdById],
//       foreignColumns: [organizations.id],
//       name: "lead_reminders_created_by_id_fk",
//     }).onDelete("cascade"),
//     index("lead_reminders_lead_id_idx").on(table.leadId),
//     index("lead_reminders_due_at_idx").on(table.dueAt),
//     index("lead_reminders_created_by_id_idx").on(table.createdById),
//     // RLS: Org members can CRUD reminders on leads they can access
//     pgPolicy("enable all for organization members", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`exists (
//         select 1 from leads l
//         join organization_members om on om.organization_id = l.organization_id
//         where l.id = ${table.leadId}
//         and om.member_organization_id in (
//           select id from organizations where auth_user_id = ${authUid}
//         )
//         and om.joined_at is not null
//       )`,
//       withCheck: sql`exists (
//         select 1 from leads l
//         join organization_members om on om.organization_id = l.organization_id
//         where l.id = ${table.leadId}
//         and om.member_organization_id in (
//           select id from organizations where auth_user_id = ${authUid}
//         )
//         and om.joined_at is not null
//       )`,
//     }),
//   ],
// );

// Relations for type-safe joins
export const leadsRelations = relations(leads, ({ one }) => ({
  organization: one(organizations, {
    fields: [leads.organizationId],
    references: [organizations.id],
  }),
  hunt: one(hunts, {
    fields: [leads.huntId],
    references: [hunts.id],
  }),
  ad: one(ads, {
    fields: [leads.adId],
    references: [ads.id],
  }),
  assignedTo: one(organizationMembers, {
    fields: [leads.assignedToId],
    references: [organizationMembers.id],
  }),
  // notes: many(leadNotes),
  // reminders: many(leadReminders),
}));

// export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
//   lead: one(leads, {
//     fields: [leadNotes.leadId],
//     references: [leads.id],
//   }),
//   createdBy: one(organizations, {
//     fields: [leadNotes.createdById],
//     references: [organizations.id],
//   }),
// }));

// export const leadRemindersRelations = relations(leadReminders, ({ one }) => ({
//   lead: one(leads, {
//     fields: [leadReminders.leadId],
//     references: [leads.id],
//   }),
//   createdBy: one(organizations, {
//     fields: [leadReminders.createdById],
//     references: [organizations.id],
//   }),
// }));
