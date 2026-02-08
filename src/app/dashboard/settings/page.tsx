import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { getUseraccount } from "@/services/account.service";
import { getTeamMembers } from "@/services/team.service";
import { isWhatsAppConnected } from "@/services/whatsapp.service";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  const dbClient = await createDrizzleSupabaseClient();

  // Fetch initial data for settings page
  const [account, members] = await Promise.all([
    getUseraccount(dbClient),
    getTeamMembers(dbClient),
  ]);

  // Get connection statuses (depends on account)
  const whatsappConnected = await isWhatsAppConnected(account.id, { dbClient });

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
          smsApiKeyConfigured={smsApiKeyConfigured}
          smsApiAllowed={smsApiAllowed}
        />
      }
    />
  );
}
