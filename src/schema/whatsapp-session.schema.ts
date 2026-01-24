import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "@/schema/account.schema";

export const whatsappSessions = pgTable(
  "whatsapp_sessions",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    // Encrypted JSON containing Baileys auth credentials
    credentials: text("credentials"),
    isConnected: boolean("is_connected").default(false).notNull(),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Users can only read their own session
    pgPolicy("enable select for own session", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.accountId}`,
    }),
    // Users can only insert their own session
    pgPolicy("enable insert for own session", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.accountId}`,
    }),
    // Users can only update their own session
    pgPolicy("enable update for own session", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.accountId}`,
      withCheck: sql`${authUid} = ${table.accountId}`,
    }),
    // Users can only delete their own session
    pgPolicy("enable delete for own session", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.accountId}`,
    }),
  ],
);

export const whatsappSessionsRelations = relations(whatsappSessions, ({ one }) => ({
  account: one(accounts, {
    fields: [whatsappSessions.accountId],
    references: [accounts.id],
  }),
}));
