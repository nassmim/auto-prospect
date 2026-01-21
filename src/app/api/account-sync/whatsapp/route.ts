import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import { connectWhatsappSchema } from "@/lib/validations/whatsapp";
import {
  findWhatsappAccountByUserId,
  upsertWhatsappAccount,
} from "@/services/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = connectWhatsappSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    await upsertWhatsappAccount(user.id, validation.data.phoneNumber);

    return NextResponse.json({
      success: true,
      message: "Ton numéro a bien été enregistré",
    });
  } catch (error) {
    console.error("WhatsApp connect error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const account = await findWhatsappAccountByUserId(user.id);

    return NextResponse.json({ account });
  } catch (error) {
    console.error("WhatsApp fetch error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
