import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { leads } from "./lead.schema";
import { messageTemplates } from "./message-template.schema";
import { accounts } from "./account.schema";

// Message channels
export const messageChannels = [
  "whatsapp",
  "sms",
  "voice",
  "leboncoin",
] as const;
export type MessageChannel = (typeof messageChannels)[number];

// Message status enum
export const messageStatuses = [
  "pending",
  "sent",
  "delivered",
  "failed",
  "read",
] as const;
export type MessageStatus = (typeof messageStatuses)[number];

// Lead activity types
export const leadActivityTypes = [
  "stage_change",
  "message_sent",
  "assignment_change",
  "note_added",
  "reminder_set",
  "created",
] as const;
export type LeadActivityType = (typeof leadActivityTypes)[number];

// Metadata types for different activity types
export type StageChangeMetadata = {
  fromStage: string;
  toStage: string;
};

export type MessageSentMetadata = {
  channel: MessageChannel;
  status: MessageStatus;
  messageId: string;
};

export type AssignmentChangeMetadata = {
  fromUserId: string | null;
  toUserId: string | null;
};

export type NoteAddedMetadata = {
  noteId: string;
  preview: string; // First 100 chars of note
};

export type ReminderSetMetadata = {
  reminderId: string;
  dueAt: Date;
};

export type ActivityMetadata =
  | StageChangeMetadata
  | MessageSentMetadata
  | AssignmentChangeMetadata
  | NoteAddedMetadata
  | ReminderSetMetadata
  | Record<string, never>; // For 'created' type

// Messages table - tracks all sent messages to leads
export const messages = pgTable(
  "messages",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id").notNull(),
    templateId: uuid("template_id"), // Null if message wasn't from template
    channel: varchar({ length: 20 })
      .$type<MessageChannel>()
      .notNull(),
    content: text().notNull(), // Rendered message with variables replaced
    status: varchar({ length: 20 })
      .$type<MessageStatus>()
      .notNull()
      .default("pending"),
    externalId: varchar("external_id", { length: 255 }), // Provider message ID for tracking
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    sentById: uuid("sent_by_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "messages_lead_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [messageTemplates.id],
      name: "messages_template_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.sentById],
      foreignColumns: [accounts.id],
      name: "messages_sent_by_id_fk",
    }).onDelete("cascade"),
    // Index for message history queries
    index("messages_lead_id_created_at_idx").on(table.leadId, table.createdAt),
    index("messages_status_idx").on(table.status),
    index("messages_external_id_idx").on(table.externalId),
    // RLS: Org members can access messages for leads in their org
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

// Lead activities table - immutable activity log for leads
export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id").notNull(),
    type: varchar({ length: 50 })
      .$type<LeadActivityType>()
      .notNull(),
    metadata: jsonb().$type<ActivityMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdById: uuid("created_by_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "lead_activities_lead_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "lead_activities_created_by_id_fk",
    }).onDelete("cascade"),
    // Index for timeline queries (chronological order)
    index("lead_activities_lead_id_created_at_idx").on(
      table.leadId,
      table.createdAt,
    ),
    index("lead_activities_type_idx").on(table.type),
    // RLS: Org members can read activities for leads in their org
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = ${table.leadId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
    // Org members can insert activities
    pgPolicy("enable insert for organization members", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
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

// Relations
export const messagesRelations = relations(messages, ({ one }) => ({
  lead: one(leads, {
    fields: [messages.leadId],
    references: [leads.id],
  }),
  template: one(messageTemplates, {
    fields: [messages.templateId],
    references: [messageTemplates.id],
  }),
  sentBy: one(accounts, {
    fields: [messages.sentById],
    references: [accounts.id],
  }),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  createdBy: one(accounts, {
    fields: [leadActivities.createdById],
    references: [accounts.id],
  }),
}));
