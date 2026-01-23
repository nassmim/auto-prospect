import { sendSms } from "@/services/messaging.services"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const to = String(body?.to ?? "")
    const from = String(body?.from ?? "")
    const message = String(body?.message ?? "")

    if (!to || !from || !message) {
      return Response.json(
        { error: "Champs requis: to, from, message" },
        { status: 400 }
      )
    }

    const provider = await sendSms({ to, from, message })

    return Response.json(
      { success: true, to, from, message, provider },
      { status: 200 }
    )
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
