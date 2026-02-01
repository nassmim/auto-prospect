import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const VOICE_PARTNER_API_URL = "https://api.voicepartner.fr/v1/campaign/send";

const sendAudioSchema = z.object({
  phoneNumbers: z.string().min(1, "Le numéro de téléphone est requis"),
  tokenAudio: z.string().min(1, "Le token audio est requis"),
  sender: z.string().optional(),
  emailForNotification: z.string().email("Email invalide").optional(),
  scheduledDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = sendAudioSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phoneNumbers, tokenAudio, sender, emailForNotification, scheduledDate } =
      validation.data;

    const apiKey = process.env.VOICE_PARTNER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Configuration API manquante" },
        { status: 500 }
      );
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
      return NextResponse.json(
        { success: false, error: data.message || "Erreur Voice Partner", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur envoi vocal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}
