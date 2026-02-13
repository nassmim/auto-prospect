import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "./account.schema";

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
    isDisconnected: boolean("is_disconnected").default(false).notNull(),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Users can only read their own session
    pgPolicy("enable all for own session", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.accountId}`,
      withCheck: sql`${authUid} = ${table.accountId}`,
    }),
  ],
);

export type TWhatsappSession = InferSelectModel<typeof whatsappSessions>;

export const whatsappSessionsRelations = relations(
  whatsappSessions,
  ({ one }) => ({
    account: one(accounts, {
      fields: [whatsappSessions.accountId],
      references: [accounts.id],
    }),
  }),
);
