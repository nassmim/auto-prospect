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

/**
 * Send SMS via SMSMobileAPI
 */
export const sendSms = async ({
  to,
  message,
  apiKey,
}: {
  to: string;
  message: string;
  apiKey: string;
}) => {
  if (!apiKey) throw new Error("API key is required");

  const body = new URLSearchParams();
  body.set("apikey", apiKey);
  body.set("recipients", to);
  body.set("message", message);
  body.set("sendsms", "1");

  const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("Failed to send SMS");

  return res.json();
};
