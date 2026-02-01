import { relations, sql } from "drizzle-orm";
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
import { contactedAds } from "@/schema/ad.schema";

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
    pgPolicy("enable update for data owners", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = id`,
      withCheck: sql`${authUid} = id`,
    }),
    // we don't do on self data because organisation can read the team members accounts
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("enable delete for authenticated users", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`true`,
    })
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  contactedAds: many(contactedAds),
}));
