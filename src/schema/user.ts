import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  pgPolicy,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 320 }),
    isPersonalAccount: boolean("is_personal_account").default(true).notNull(),
    pictureUrl: varchar("picture_url", { length: 1000 }),
    phoneNumber: varchar("phone_number", { length: 14 }),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
	  // reference to the auth table from Supabase
      foreignColumns: [authUsers.id],
      name: "accounts_id_fk",
    }).onDelete("cascade"),    
    unique("accounts_email_key").on(table.email),
    pgPolicy("accounts_self_update", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = id`,
      withCheck: sql`${authUid} = id`,
    }),
    pgPolicy("accounts_read", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
    }),
    pgPolicy("create_org_account", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
    }),
    pgPolicy("delete_team_account", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
    })
  ],
);
