import { EMessageType } from "@/constants/enums";
import { sql } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgPolicy,
  pgTable,
  smallserial,
  unique,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const MessageTypeDBEnum = pgEnum(
  "message_type",
  Object.values(EMessageType) as [string, ...string[]],
);

export const appSettings = pgTable("app_settings", {
  id: smallserial().primaryKey(),
  smsAlerts: boolean("sms_alerts").default(false),
  slackAlerts: boolean("slack_alerts").default(true),
});

export const messageTypes = pgTable(
  "message_types",
  {
    id: smallserial().primaryKey(),
    name: MessageTypeDBEnum(),
  },
  (table) => [
    unique("message_types_name_unique").on(table.name),
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
