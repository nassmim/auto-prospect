import { getDBAdminClient } from "@auto-prospect/db";
import { sendSlackMessage } from "./message.service";

export const sendAlertToAdmin = async (message: string): Promise<void> => {
  const dbClient = getDBAdminClient();

  const appSettings = await dbClient.query.appSettings.findFirst();
  if (appSettings?.smsAlerts) {
    // TODO: send sms alert
  }
  if (appSettings?.slackAlerts) {
    await sendSlackMessage(message);
  }
};
