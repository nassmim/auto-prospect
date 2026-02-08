import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { getUseraccount } from "@/services/account.service";
import { hasSmsApiKeyAction } from "@/services/message.service";
import { getTeamMembers } from "@/services/team.service";
import { isWhatsAppConnected } from "@/services/whatsapp.service";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  // Fetch initial data for settings page
  const [account, members] = await Promise.all([
    getUseraccount(),
    getTeamMembers(),
  ]);

  // Get connection statuses (depends on account)
  const [whatsappConnected, smsApiKeyConfigured] = await Promise.all([
    isWhatsAppConnected(account.id),
    hasSmsApiKeyAction(),
  ]);

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
        />
      }
    />
  );
}
