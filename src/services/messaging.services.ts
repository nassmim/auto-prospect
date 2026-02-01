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
  senderId,
}: {
  to: string;
  message: string;
  senderId: string; 
}) => {
  const apiKey = process.env.SMSMOBILEAPI_API_KEY;
  if (!apiKey) throw new Error("Missing SMSMOBILEAPI_API_KEY");

  if (!senderId) throw new Error("senderId is required");

  const body = new URLSearchParams();
  body.set("apikey", apiKey);
  body.set("recipients", to);
  body.set("message", message);
  body.set("sendsms", "1");
  body.set("sIdentifiant", senderId);

  const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("Failed to send SMS");

  return res.json();
};
