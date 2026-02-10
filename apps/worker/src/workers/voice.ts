/**
 * Voice/Ringless Voicemail Worker
 *
 * Processes ringless voicemail delivery jobs using Voice Partner API.
 * Deposits pre-recorded audio messages directly to recipient voicemail.
 */

import { Job } from "bullmq";

interface VoiceJob {
  recipientPhone: string; // Phone number(s) to call
  tokenAudio: string; // Required: Pre-recorded audio token from Voice Partner
  sender?: string; // Optional: Caller ID
  emailForNotification?: string; // Optional: Email for delivery notifications
  scheduledDate?: string; // Optional: Schedule for future delivery
  metadata?: {
    huntId?: string;
    accountId?: string;
    adId?: string;
  };
}

/**
 * Sends a voice message via Voice Partner API
 */
async function sendVoiceMessage(input: {
  phoneNumbers: string;
  tokenAudio: string;
  sender?: string;
  emailForNotification?: string;
  scheduledDate?: string;
}): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
  const apiKey = process.env.VOICE_PARTNER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "API key missing" };
  }

  const payload: Record<string, string> = {
    apiKey,
    tokenAudio: input.tokenAudio,
    phoneNumbers: input.phoneNumbers,
    emailForNotification: input.emailForNotification || "noreply@auto-prospect.com",
  };

  if (input.sender) {
    payload.sender = input.sender;
  }

  if (input.scheduledDate) {
    payload.scheduledDate = input.scheduledDate;
  }

  try {
    const response = await fetch("https://api.voicepartner.fr/v1/campaign/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: (data.message as string) || "Voice Partner API error",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    };
  }
}

export async function voiceWorker(job: Job<VoiceJob>) {
  const { recipientPhone, tokenAudio, sender, emailForNotification, scheduledDate, metadata } = job.data;

  // Validate required fields
  if (!recipientPhone) {
    throw new Error("Recipient phone number is required");
  }

  if (!tokenAudio) {
    throw new Error("Audio token is required - pre-recorded audio must be provided");
  }

  try {
    const result = await sendVoiceMessage({
      phoneNumbers: recipientPhone,
      tokenAudio,
      sender,
      emailForNotification,
      scheduledDate,
    });

    if (!result.success) {
      throw new Error(result.error || "Voice message send failed");
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: result.data,
      metadata,
    };
  } catch (error) {
    throw error;
  }
}
