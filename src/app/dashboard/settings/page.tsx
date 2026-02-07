import { getUseraccount } from "@/services/account.service";
import { getTeamMembers } from "@/services/team.service";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  // Fetch initial data for settings page
  const [account, members] = await Promise.all([
    getUseraccount(),
    getTeamMembers(),
  ]);

  return (
    <SettingsPageClient
      account={account}
      userRole={"owner"}
      initialMembers={members}
    />
  );
}
