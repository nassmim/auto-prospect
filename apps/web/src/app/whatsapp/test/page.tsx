import { getUserAccount } from "@/services/account.service";
import { getWhatsAppSession } from "@/services/whatsapp.service";
import { WhatsAppTestClient } from "./whatsapp-test-client";

export default async function WhatsAppTestPage() {
  const account = await getUserAccount(undefined, {
    columnsToKeep: { id: true, whatsappPhoneNumber: true, email: true },
  });

  // Fetch initial data if user is authenticated
  let initialData = null;
  if (account) {
    const response = await getWhatsAppSession(account.id);
    const connected = response.session?.isConnected;

    initialData = {
      userId: account.id,
      email: account.email,
      phoneNumber: account.whatsappPhoneNumber,
      isConnected: !!connected,
    };
  }

  return <WhatsAppTestClient initialData={initialData} />;
}
