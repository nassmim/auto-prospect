import { EaccountType } from "@/constants/enums";
import { InferSelectModel, sql } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

// account settings type for JSONB field
export type accountSettings = {
  allowReassignment?: boolean;
  restrictVisibility?: boolean;
  dailyReset?: boolean;
  ignorePhonesVisible?: boolean;
};

// Types of accounts
export const accountType = pgEnum(
  "account_type",
  Object.values(EaccountType) as [string, ...string[]],
);

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
    smsApiKey: varchar("sms_api_key", { length: 500 }),
    // account type discriminator
    type: accountType("type").notNull().default(EaccountType.PERSONAL),
    settings: jsonb().$type<accountSettings>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("enable update for account owners", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id`,
      withCheck: sql`
        ${authUid} = auth_user_id`,
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
        ${authUid} = auth_user_id`,
    }),
  ],
);
export type TAccount = InferSelectModel<typeof accounts>;
