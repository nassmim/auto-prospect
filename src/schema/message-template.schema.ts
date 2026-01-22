import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "./account.schema";
import { organizations } from "./organization.schema";

// Message template types
export const messageTemplateTypes = ["text", "voice"] as const;
export type MessageTemplateType = (typeof messageTemplateTypes)[number];

// Message channels
export const messageChannels = ["whatsapp", "sms", "leboncoin"] as const;
export type MessageChannel = (typeof messageChannels)[number];

// Message templates table - organization-scoped text/voice templates
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 20 })
      .$type<MessageTemplateType>()
      .notNull(),
    channel: varchar({ length: 20 }).$type<MessageChannel>(), // null for voice templates
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
    createdById: uuid("created_by_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "message_templates_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "message_templates_created_by_id_fk",
    }),
    // Organization members can perform all operations on templates
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

// Template variables table - static reference for available variables
export const templateVariables = pgTable("template_variables", {
  id: serial().primaryKey().notNull(),
  key: varchar({ length: 50 }).notNull().unique(), // e.g., 'titre_annonce'
  label: varchar({ length: 100 }).notNull(), // Display name in French
  description: text(),
});

// Relations
export const messageTemplatesRelations = relations(
  messageTemplates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [messageTemplates.organizationId],
      references: [organizations.id],
    }),
    createdBy: one(accounts, {
      fields: [messageTemplates.createdById],
      references: [accounts.id],
    }),
  }),
);
