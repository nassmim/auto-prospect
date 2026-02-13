import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { getUserAccount } from "@/services/account.service";
import { getTeamMembers } from "@/services/team.service";
import {
  isWhatsAppConnected,
  isWhatsAppDisconnected,
} from "@/services/whatsapp.service";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  const dbClient = await createDrizzleSupabaseClient();

  // Fetch initial data for settings page
  const [account, members] = await Promise.all([
    getUserAccount(dbClient),
    getTeamMembers(dbClient),
  ]);

  // Get connection statuses (depends on account)
  const [whatsappConnected, whatsappDisconnected] = await Promise.all([
    isWhatsAppConnected(account.id, { dbClient }),
    isWhatsAppDisconnected(account.id, { dbClient }),
  ]);

  const { smsApiKey, smsMobileAPiAllowed: smsApiAllowed } = account;
  const smsApiKeyConfigured = !!smsApiKey;

  return (
    <SettingsPageClient
      account={account}
      userRole={"owner"}
      initialMembers={members}
      connectedAccountsTab={
        <ConnectedAccountsTab
          accountId={account.id}
          whatsappPhoneNumber={account.whatsappPhoneNumber}
          whatsappConnected={whatsappConnected}
          whatsappDisconnected={whatsappDisconnected}
          smsApiKeyConfigured={smsApiKeyConfigured}
          smsApiAllowed={smsApiAllowed}
        />
      }
    />
  );
}
