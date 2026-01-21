import { sql } from "drizzle-orm";
import {
  foreignKey,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "./user";

export const whatsappAccounts = pgTable(
  "whatsapp_accounts",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    accountId: uuid("account_id").notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    status: varchar({ length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [accounts.id],
      name: "whatsapp_accounts_account_id_fk",
    }).onDelete("cascade"),
    pgPolicy("whatsapp_accounts_select", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = account_id`,
    }),
    pgPolicy("whatsapp_accounts_insert", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = account_id`,
    }),
    pgPolicy("whatsapp_accounts_update", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = account_id`,
      withCheck: sql`${authUid} = account_id`,
    }),
    pgPolicy("whatsapp_accounts_delete", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = account_id`,
    }),
  ],
);
