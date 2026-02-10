import {
  EContactChannel,
  EMessageStatus,
  MESSAGE_STATUS_VALUES,
} from "@auto-prospect/shared";
import { InferInsertModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  serial,
  smallint,
  smallserial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, serviceRole } from "drizzle-orm/supabase";
import { accounts } from "./account.schema";
import { leads } from "./lead.schema";
import { teamMembers } from "./team.schema";

// Contact channel enum (used for channel priorities and templates)
export const channel = pgEnum("channel", EContactChannel);

// Message status enum
export const messageStatus = pgEnum("message_status", MESSAGE_STATUS_VALUES);

// Channel priorities table - defines which channels to try first
export const channelPriorities = pgTable(
  "channel_priorities",
  {
    id: smallserial().primaryKey(),
    channel: channel().notNull(),
    priority: smallint().notNull(),
  },
  (table) => [
    unique("channel_priorities_channel_unique").on(table.channel),
    unique("channel_priorities_priority_unique").on(table.priority),
    pgPolicy("enable all for service role", {
      as: "permissive",
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

// Message templates table - account-scoped text/voice templates
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull(),
    name: text().notNull(),
    channel: channel().notNull(),
    content: text(), // Template content with variable placeholders like {titre_annonce}
    audioUrl: text("audio_url"), // Supabase Storage URL for voice templates
    audioDuration: integer("audio_duration"), // Duration in seconds (validated 15-55)
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    // createdById: uuid("created_by_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [accounts.id],
      name: "message_templates_organization_id_fk",
    }).onDelete("cascade"),
    // foreignKey({
    //   columns: [table.createdById],
    //   foreignColumns: [accounts.id],
    //   name: "message_templates_created_by_id_fk",
    // }),
    pgPolicy("enable all for owners of the associated account", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
      withCheck: sql`${table.accountId} = ${authUid}`,
    }),
    // // account members can perform all operations on templates
    // pgPolicy("enable all for account members", {
    //   as: "permissive",
    //   for: "all",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.account_id = ${table.accountId}
    //     and om.member_organization_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //     select 1 from organization_members om
    //     where om.account_id = ${table.accountId}
    //     and om.member_organization_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
  ],
);
export type TMessageTemplateInsert = InferInsertModel<typeof messageTemplates>;

// Template variables table - static reference for available variables
export const templateVariables = pgTable("template_variables", {
  id: serial().primaryKey(),
  key: text().notNull().unique(), // e.g., 'titre_annonce'
  label: text().notNull(), // Display name in French
  description: text(),
});

// Messages table - tracks all sent messages to leads
export const messages = pgTable(
  "messages",
  {
    id: uuid().defaultRandom().primaryKey(),
    leadId: uuid("lead_id").notNull(),
    templateId: uuid("template_id"), // Null if message wasn't from template
    channel: channel().notNull(),
    content: text().notNull(), // Rendered message with variables replaced
    status: messageStatus().notNull().default(EMessageStatus.PENDING),
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
      foreignColumns: [teamMembers.id],
      name: "messages_sent_by_id_fk",
    }).onDelete("cascade"),
    // Index for message history queries
    index("messages_lead_id_created_at_idx").on(table.leadId, table.createdAt),
    index("messages_status_idx").on(table.status),
    index("messages_external_id_idx").on(table.externalId),
    pgPolicy("enable all for account owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from leads l
        where l.id = ${table.leadId}
        and l.account_id = ${authUid}
      )`,
    }),
    // // RLS: Org members can access messages for leads in their org
    // pgPolicy("enable all for account members", {
    //   as: "permissive",
    //   for: "all",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from leads l
    //     join organizations_members om on om.account_id = l.account_id
    //     where l.id = ${table.leadId}
    //     and om.member_organization_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //     select 1 from leads l
    //     join organizations_members om on om.account_id = l.account_id
    //     where l.id = ${table.leadId}
    //     and om.member_organization_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // }),
  ],
);
export type TMessageInsert = InferInsertModel<typeof messages>;

// Relations
export const messageTemplatesRelations = relations(
  messageTemplates,
  ({ one }) => ({
    account: one(accounts, {
      fields: [messageTemplates.accountId],
      references: [accounts.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  lead: one(leads, {
    fields: [messages.leadId],
    references: [leads.id],
  }),
  template: one(messageTemplates, {
    fields: [messages.templateId],
    references: [messageTemplates.id],
  }),
  sentBy: one(teamMembers, {
    fields: [messages.sentById],
    references: [teamMembers.id],
  }),
}));
