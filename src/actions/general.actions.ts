"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { sendSlackMessage } from "@/services/messaging.services";

export const sendAlertToAdmin = async (message: string): Promise<void> => {
  const dbClient = await createDrizzleSupabaseClient();

  const appSettings = await dbClient.admin.query.appSettings.findFirst();
  if (appSettings?.smsAlerts) {
    // TODO: send sms alert
  }
  if (appSettings?.slackAlerts) await sendSlackMessage(message);
};
