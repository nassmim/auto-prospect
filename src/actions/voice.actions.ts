"use server";

import { z } from "zod";

const VOICE_PARTNER_API_URL = "https://api.voicepartner.fr/v1/campaign/send";

const sendVoiceMessageSchema = z.object({
  phoneNumbers: z.string().min(1, "Le numéro de téléphone est requis"),
  tokenAudio: z.string().min(1, "Le token audio est requis"),
  sender: z.string().optional(),
  emailForNotification: z.string().email("Email invalide").optional(),
  scheduledDate: z.string().optional(),
});

export type SendVoiceMessageInput = z.infer<typeof sendVoiceMessageSchema>;

type SendVoiceMessageResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

/**
 * Sends a voice message to a phone number via Voice Partner API
 * The message is deposited on the recipient's voicemail
 */
export async function sendVoiceMessage(
  input: SendVoiceMessageInput
): Promise<SendVoiceMessageResult> {
  // Validate input
  const validation = sendVoiceMessageSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { phoneNumbers, tokenAudio, sender, emailForNotification, scheduledDate } =
    validation.data;

  const apiKey = process.env.VOICE_PARTNER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Configuration API manquante" };
  }

  // Build request payload
  const payload: Record<string, string> = {
    apiKey,
    tokenAudio,
    phoneNumbers,
    emailForNotification: emailForNotification || "noreply@auto-prospect.com",
  };

  if (sender) {
    payload.sender = sender;
  }

  if (scheduledDate) {
    payload.scheduledDate = scheduledDate;
  }

  try {
    // Call Voice Partner API
    const response = await fetch(VOICE_PARTNER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Erreur Voice Partner",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne",
    };
  }
}
