import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { pages } from "@/config/routes";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { getSEOTags } from "@/lib/seo";
import { getUserAccount } from "@/services/account.service";
import { getTeamMembers } from "@/services/team.service";
import {
  isWhatsAppConnected,
  isWhatsAppDisconnected,
} from "@/services/whatsapp.service";
import { SettingsPageClient } from "./settings-page-client";

export const metadata = getSEOTags({
  title: "Paramètres",
  description:
    "Configure ton compte, gère les intégrations et les paramètres de ton équipe",
  canonical: pages.settings,
});

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
