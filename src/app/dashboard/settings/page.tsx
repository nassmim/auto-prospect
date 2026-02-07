import { isWhatsAppConnected } from "@/actions/whatsapp.actions";
import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { getUseraccount } from "@/services/account.service";
import { getTeamMembers } from "@/services/team.service";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  // Fetch initial data for settings page
  const [account, members] = await Promise.all([
    getUseraccount(),
    getTeamMembers(),
  ]);

  // Get WhatsApp connection status
  const whatsappConnected = await isWhatsAppConnected(account.id);

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
        />
      }
    />
  );
}
