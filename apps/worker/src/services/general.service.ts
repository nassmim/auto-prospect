import { getAdminClient } from "./db.service";

export const sendAlertToAdmin = async (message: string): Promise<void> => {
  const dbClient = getAdminClient();

  const appSettings = await dbClient.query.appSettings.findFirst();
  if (appSettings?.smsAlerts) {
    // TODO: send sms alert
  }
  if (appSettings?.slackAlerts) {
    // TODO: send slack message
    console.warn("Slack alert:", message);
  }
};
