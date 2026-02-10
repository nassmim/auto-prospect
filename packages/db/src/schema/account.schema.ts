import {
  ACCOUNT_TYPE_VALUES,
  EAccountType,
  TAccountSettings,
} from "@auto-prospect/shared";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { contactedAds } from "./ad.schema";
import { whatsappSessions } from "./whatsapp-session.schema";

// Types of accounts
export const accountType = pgEnum("account_type", ACCOUNT_TYPE_VALUES);

// accounts table - will have either just one member or several
export const accounts = pgTable(
  "accounts",
  {
    id: uuid().primaryKey(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 320 }).notNull(),
    pictureUrl: varchar("picture_url", { length: 1000 }),
    phoneNumber: varchar("phone_number", { length: 14 }),
    whatsappPhoneNumber: varchar("whatsapp_phone_number", { length: 20 }),
    smsMobileAPiAllowed: boolean("sms_mobile_api_allowed")
      .default(false)
      .notNull(),
    smsApiKey: varchar("sms_api_key", { length: 500 }),
    // account type discriminator
    type: accountType("type").notNull().default(EAccountType.PERSONAL),
    settings: jsonb().$type<TAccountSettings>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedByAdmin: boolean("confirmed_by_admin").default(false).notNull(),
  },
  (table) => [
    pgPolicy("enable update for account owners", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`
        ${authUid} = ${table.id}`,
      withCheck: sql`
        ${authUid} = ${table.id}`,
    }),
    // Users can delete their own org
    pgPolicy("enable delete for account owners", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`
        ${authUid} = ${table.id} 
      `,
    }),
    // Members can read data for orgs they belong to
    pgPolicy("enable read for account owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${authUid} = ${table.id} `,
    }),
  ],
);
export type TAccount = InferSelectModel<typeof accounts>;
/**
 * Type helper to extract keys from columns object where value is true
 */
export type TAccountSelectedKeys<
  T extends Partial<Record<keyof TAccount, boolean>>,
> = {
  [K in keyof T]: T[K] extends true ? K : never;
}[keyof T] &
  keyof TAccount;

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  contactedAds: many(contactedAds),
  whatsappSession: one(whatsappSessions),
}));
