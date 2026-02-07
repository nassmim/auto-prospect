import { createClient } from "@/lib/supabase/server";
import { getWhatsAppPhoneNumber, isWhatsAppConnected } from "@/actions/whatsapp.actions";
import { WhatsAppTestClient } from "./whatsapp-test-client";

export default async function WhatsAppTestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For a test page, we might want to allow unauthenticated users
  // but if you want to enforce auth, uncomment:
  // if (!user) {
  //   redirect("/login");
  // }

  // Fetch initial data if user is authenticated
  let initialData = null;
  if (user) {
    const [phoneNumber, connected] = await Promise.all([
      getWhatsAppPhoneNumber(user.id, { bypassRLS: true }),
      isWhatsAppConnected(user.id),
    ]);

    initialData = {
      userId: user.id,
      email: user.email,
      phoneNumber,
      isConnected: connected,
    };
  }

  return <WhatsAppTestClient initialData={initialData} />;
}
