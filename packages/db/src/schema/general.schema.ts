import { sql } from "drizzle-orm";
import { boolean, pgPolicy, pgTable, smallserial } from "drizzle-orm/pg-core";
import { serviceRole } from "drizzle-orm/supabase/rls";

export const appSettings = pgTable(
  "app_settings",
  {
    id: smallserial().primaryKey(),
    smsAlerts: boolean("sms_alerts").default(false),
    slackAlerts: boolean("slack_alerts").default(true),
  },
  () => [
    pgPolicy("enable all for service role", {
      as: "permissive",
      for: "all",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);
