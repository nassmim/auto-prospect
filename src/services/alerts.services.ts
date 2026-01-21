
export const sendAlertToAdmin = async ({
  message,
  withSms,
  withSlack,
}: {
  message: string;
  withSms?: boolean;
  withSlack?: boolean;
}) => {
  if (withSms) {
    // TODO: send sms alert
  }
  await sendSlackAlert(message);
};



/**
 * SERVICE INTERNE SLACK
 */
const sendSlackAlert = async (message: string) => {
  const webhook = process.env.SLACK_WEBHOOK_URL! 
  const payload = {
    text: message,
  };

  await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};