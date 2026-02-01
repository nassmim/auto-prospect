import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/services/messaging.services";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const accountId = body?.accountId ?? user.id;
    const senderId = process.env.INTERNAL_PHONE_ID;
    const to = process.env.INTERNAL_PHONE_NUMBER;

    if (!senderId || !to) {
      return Response.json(
        { ok: false, error: "Internal phone variable are not set" },
        { status: 500 },
      );
    }

    await sendSms({
      to,
      message: `Le compte ${accountId} veut envoyer des sms`,
      senderId,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("phone-sms error", e);
    return Response.json(
      { ok: false, error: "Erreur envoi SMS" },
      { status: 500 }
    );
  }
}
