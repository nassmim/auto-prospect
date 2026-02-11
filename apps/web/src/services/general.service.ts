import { createDrizzleSupabaseClient } from "@/lib/db";
import { sendSlackMessage } from "@/services/message.service";

export const sendAlertToAdmin = async (message: string): Promise<void> => {
  const dbClient = await createDrizzleSupabaseClient();

  const appSettings = await dbClient.admin.query.appSettings.findFirst();
  if (appSettings?.smsAlerts) {
    // TODO: send sms alert
  }
  if (appSettings?.slackAlerts) await sendSlackMessage(message);
};
