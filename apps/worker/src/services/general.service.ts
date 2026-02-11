import { getDBAdminClient } from "@auto-prospect/db";

export const sendAlertToAdmin = async (message: string): Promise<void> => {
  const dbClient = getDBAdminClient();

  const appSettings = await dbClient.query.appSettings.findFirst();
  if (appSettings?.smsAlerts) {
    // TODO: send sms alert
  }
  if (appSettings?.slackAlerts) {
    // TODO: send slack message
    console.warn("Slack alert:", message);
  }
};
