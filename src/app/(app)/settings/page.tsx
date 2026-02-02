import {
  getCurrentaccount,
  getaccountInvitations,
  getteamMembers,
} from "@/actions/account.actions";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  // Fetch initial data for settings page
  const [orgData, members, invitations] = await Promise.all([
    getCurrentaccount(),
    getteamMembers(),
    getaccountInvitations(),
  ]);

  return (
    <SettingsPageClient
      account={orgData.account}
      userRole={orgData.role}
      initialMembers={members}
      initialInvitations={invitations}
    />
  );
}
