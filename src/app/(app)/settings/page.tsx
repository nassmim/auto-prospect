import { SettingsPageClient } from "./settings-page-client";
import {
  getCurrentOrganization,
  getOrganizationMembers,
  getOrganizationInvitations,
} from "@/actions/organization.actions";

export default async function SettingsPage() {
  // Fetch initial data for settings page
  const [orgData, members, invitations] = await Promise.all([
    getCurrentOrganization(),
    getOrganizationMembers(),
    getOrganizationInvitations(),
  ]);

  return (
    <SettingsPageClient
      organization={orgData.organization}
      userRole={orgData.role}
      initialMembers={members}
      initialInvitations={invitations}
    />
  );
}
