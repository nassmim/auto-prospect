import { createClient } from "@/lib/supabase/server"
import { sendSms } from "@/services/messaging.services"

export async function POST(req: Request) {
  try {

    // DO WE WANT TO CHECK IF USER IS CONNECTED

    const body = await req.json()

    const to = String(body?.to ?? "")
    const message = String(body?.message ?? "")

    if (!to || !message) {
      return Response.json(
        { error: "Champs requis: to, message" },
        { status: 400 }
      )
    }

    // TODO GET USER.PHONEID from db

        
    const provider = await sendSms({ 
      to, 
      // senderId, 
      message 
    })

    return Response.json(
      { success: true, to, message, provider },
      { status: 200 }
    )
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
