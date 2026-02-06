import { boolean, pgTable, smallserial } from "drizzle-orm/pg-core";

export const appSettings = pgTable("app_settings", {
  id: smallserial().primaryKey(),
  smsAlerts: boolean("sms_alerts").default(false),
  slackAlerts: boolean("slack_alerts").default(true),
});
