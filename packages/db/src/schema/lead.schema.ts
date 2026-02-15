import {
  ELeadStage,
  LEAD_ACTIVITY_TYPE_VALUES,
  LEAD_STAGE_VALUES,
  TMessageStatus,
} from "@auto-prospect/shared";
import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "./account.schema";
import { ads } from "./ad.schema";
import { hunts } from "./hunt.schema";
import { teamMembers } from "./team.schema";

// Metadata types for different activity types
type TStageChangeMetadata = {
  fromStage: string;
  toStage: string;
};

type TMessageSentMetadata = {
  channel: MessageChannel;
  status: TMessageStatus;
  messageId: string;
};

type TAssignmentChangeMetadata = {
  fromUserId: string | null;
  toUserId: string | null;
};

type TNoteAddedMetadata = {
  noteId: string;
  preview: string; // First 100 chars of note
};

type TReminderSetMetadata = {
  reminderId: string;
  dueAt: Date;
};

type TActivityMetadata =
  | TStageChangeMetadata
  | TMessageSentMetadata
  | TAssignmentChangeMetadata
  | TNoteAddedMetadata
  | TReminderSetMetadata
  | Record<string, never>; // For 'created' type

// Lead stage enum - pipeline stages for the Kanban view
export const leadStage = pgEnum("lead_stage", LEAD_STAGE_VALUES);

export const leadActivityType = pgEnum(
  "lead_activity_type",
  LEAD_ACTIVITY_TYPE_VALUES,
);

// Leads table - connects ads to accounts with pipeline tracking
export const leads = pgTable(
  "leads",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    huntId: uuid("hunt_id")
      .references(() => hunts.id, { onDelete: "cascade" })
      .notNull(),
    adId: uuid("ad_id")
      .references(() => ads.id, { onDelete: "cascade" })
      .notNull(),
    stage: leadStage().notNull().default(ELeadStage.NEW),
    assignedToId: uuid("assigned_to_id").references(() => teamMembers.id, {
      onDelete: "set null",
    }),
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
    // Prevent duplicate leads for the same ad in an account
    unique("leads_account_id_ad_id_key").on(table.accountId, table.adId),
    // Performance indexes for Kanban queries
    index("leads_account_id_stage_idx").on(table.accountId, table.stage),
    index("leads_account_id_assigned_to_id_idx").on(
      table.accountId,
      table.assignedToId,
    ),
    index("leads_hunt_id_idx").on(table.huntId),
    index("leads_ad_id_idx").on(table.adId),
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    pgPolicy("enable read for owners of the associated account", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
    }),
    pgPolicy("enable update for owners of the associated account", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
      withCheck: sql`${table.accountId} = ${authUid}`,
    }),
    // // RLS: account members can access all leads in their org
    // pgPolicy("enable all for account members", {
    //   as: "permissive",
    //   for: "all",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and om.member_account_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and om.member_account_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
  ],
);
export type TLeadInsert = InferInsertModel<typeof leads>;
export type TLead = InferSelectModel<typeof leads>;

// Lead notes table - activity log and notes for each lead
export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    content: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lead_notes_lead_id_idx").on(table.leadId),
    // RLS: Org members can CRUD notes on leads they can access
    pgPolicy("enable all for account members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid})`,
      withCheck: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid})`,
    }),
  ],
);

// Lead reminders table - follow-up reminders for leads
export const leadReminders = pgTable(
  "lead_reminders",
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    note: text(),
    completed: boolean().notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lead_reminders_lead_id_idx").on(table.leadId),
    index("lead_reminders_due_at_idx").on(table.dueAt),
    // RLS: Org members can CRUD reminders on leads they can access
    pgPolicy("enable all for account members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid})`,
      withCheck: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid})`,
    }),
  ],
);

// Lead activities table - immutable activity log for leads
export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid().defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: leadActivityType().notNull(),
    metadata: jsonb().$type<TActivityMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for timeline queries (chronological order)
    index("lead_activities_lead_id_created_at_idx").on(
      table.leadId,
      table.createdAt,
    ),
    index("lead_activities_type_idx").on(table.type),
    pgPolicy("enable read for account owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid}
      )`,
    }),
    // Org members can insert activities
    pgPolicy("enable insert for account owners", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
              select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid}
      )`,
    }),
    // // RLS: Org members can read activities for leads in their org
    // pgPolicy("enable read for account members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from leads l
    //     join accounts_members om on om.account_id = l.account_id
    //     where l.id = ${table.leadId}
    //     and om.member_account_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
    // // Org members can insert activities
    // pgPolicy("enable insert for account members", {
    //   as: "permissive",
    //   for: "insert",
    //   to: authenticatedRole,
    //   withCheck: sql`exists (
    //     select 1 from leads l
    //     join accounts_members om on om.account_id = l.account_id
    //     where l.id = ${table.leadId}
    //     and om.member_account_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
  ],
);
export type TLeadActivityInsert = InferInsertModel<typeof leadActivities>;

// Relations for type-safe joins
export const leadsRelations = relations(leads, ({ one, many }) => ({
  account: one(accounts, {
    fields: [leads.accountId],
    references: [accounts.id],
  }),
  hunt: one(hunts, {
    fields: [leads.huntId],
    references: [hunts.id],
  }),
  ad: one(ads, {
    fields: [leads.adId],
    references: [ads.id],
  }),
  assignedTo: one(teamMembers, {
    fields: [leads.assignedToId],
    references: [teamMembers.id],
  }),
  notes: many(leadNotes),
  reminders: many(leadReminders),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
}));

export const leadRemindersRelations = relations(leadReminders, ({ one }) => ({
  lead: one(leads, {
    fields: [leadReminders.leadId],
    references: [leads.id],
  }),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
}));
