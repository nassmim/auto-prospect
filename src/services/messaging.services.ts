/**
 * Send message to slack channel
 */
export const sendSlackMessage = async (message: string) => {
  const webhook = process.env.SLACK_WEBHOOK_URL!;
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
