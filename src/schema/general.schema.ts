import { EMessageType } from "@/constants/enums";
import { sql } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  smallserial,
} from "drizzle-orm/pg-core";

// Re-export messageType enum for backward compatibility
export const MessageTypeDBEnum = pgEnum(
  "message_type",
  Object.values(EMessageType) as [string, ...string[]],
);

export const appSettings = pgTable("app_settings", {
  id: smallserial().primaryKey(),
  smsAlerts: boolean("sms_alerts").default(false),
  slackAlerts: boolean("slack_alerts").default(true),
});
