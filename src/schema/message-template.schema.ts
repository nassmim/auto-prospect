import { EMessageChannel, EMessageType } from "@/constants/enums";
import { InferInsertModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { organizations } from "./organization.schema";

export const messageType = pgEnum(
  "message_type",
  Object.values(EMessageType) as [string, ...string[]],
);

// Message channels enum
export const messageChannel = pgEnum(
  "message_channel",
  Object.values(EMessageChannel) as [string, ...string[]],
);
export type MessageChannel =
  (typeof EMessageChannel)[keyof typeof EMessageChannel];

// Message templates table - organization-scoped text/voice templates
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    name: text().notNull(),
    type: messageType().notNull(),
    channel: messageChannel(), // null for voice templates
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
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "message_templates_organization_id_fk",
    }).onDelete("cascade"),
    // foreignKey({
    //   columns: [table.createdById],
    //   foreignColumns: [organizations.id],
    //   name: "message_templates_created_by_id_fk",
    // }),
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
    // // Organization members can perform all operations on templates
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
export type TMessageTemplateInsert = InferInsertModel<typeof messageTemplates>;

// Template variables table - static reference for available variables
export const templateVariables = pgTable("template_variables", {
  id: serial().primaryKey(),
  key: text().notNull().unique(), // e.g., 'titre_annonce'
  label: text().notNull(), // Display name in French
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
    // createdBy: one(organizations, {
    //   fields: [messageTemplates.createdById],
    //   references: [organizations.id],
    // }),
  }),
);
