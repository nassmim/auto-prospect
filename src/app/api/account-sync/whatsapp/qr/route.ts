import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { createApiClient } from "@/lib/supabase/api";
import {
  closeWhatsappConnection,
  createWhatsappConnection,
  findWhatsappAccountByUserId,
  updateWhatsappAccountStatus,
} from "@/services/whatsapp";

export async function GET(request: NextRequest) {
  const supabase = createApiClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const account = await findWhatsappAccountByUserId(user.id);

  if (!account) {
    return new Response(JSON.stringify({ error: "Aucun compte WhatsApp trouvé. Enregistre d'abord ton numéro." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      const cleanup = async () => {
        if (!isClosed) {
          isClosed = true;
          await closeWhatsappConnection(user.id);
          try {
            controller.close();
          } catch {}
        }
      };

      try {
        await updateWhatsappAccountStatus(user.id, "connecting");

        await createWhatsappConnection(user.id, async (update) => {
          if (isClosed) return;

          if (update.qrCode) {
            const qrBase64 = await QRCode.toDataURL(update.qrCode);
            sendEvent("qr", { qrCode: qrBase64 });
          }

          if (update.status === "connected") {
            await updateWhatsappAccountStatus(user.id, "connected");
            sendEvent("connected", { message: "WhatsApp connecté avec succès" });
            await cleanup();
          }

          if (update.status === "disconnected") {
            await updateWhatsappAccountStatus(user.id, "disconnected");
            sendEvent("disconnected", { message: "Connexion perdue" });
            await cleanup();
          }
        });
      } catch (error) {
        console.error("WhatsApp QR error:", error);
        sendEvent("error", { message: "Erreur lors de la connexion" });
        await cleanup();
      }
    },
    cancel() {
      isClosed = true;
      closeWhatsappConnection(user.id);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
