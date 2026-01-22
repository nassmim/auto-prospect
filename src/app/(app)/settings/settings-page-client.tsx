"use client";

import { useState } from "react";
import { ConnectedAccountsTab } from "@/components/settings/connected-accounts-tab";
import { FiltersTab } from "@/components/settings/filters-tab";
import { MessagesTab } from "@/components/settings/messages-tab";
import { TeamTab } from "@/components/settings/team-tab";
import type { OrganizationSettings } from "@/schema/organization.schema";

type Tab = "accounts" | "filters" | "messages" | "team";

type SettingsPageClientProps = {
  organization: {
    id: string;
    name: string;
    ownerId: string;
    settings: OrganizationSettings | null;
    createdAt: Date;
  };
  userRole: "owner" | "admin" | "user";
  initialMembers: any[];
  initialInvitations: any[];
};

export function SettingsPageClient({
  organization,
  userRole,
  initialMembers,
  initialInvitations,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");

  const tabs = [
    {
      id: "accounts" as const,
      label: "Comptes connectés",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
    },
    {
      id: "filters" as const,
      label: "Filtres",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      ),
    },
    {
      id: "messages" as const,
      label: "Messages",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
    {
      id: "team" as const,
      label: "Équipe",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gérez vos paramètres et votre équipe
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-500"
                  : "border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "accounts" && <ConnectedAccountsTab />}
        {activeTab === "filters" && (
          <FiltersTab settings={organization.settings} />
        )}
        {activeTab === "messages" && (
          <MessagesTab settings={organization.settings} />
        )}
        {activeTab === "team" && (
          <TeamTab
            organization={organization}
            userRole={userRole}
            initialMembers={initialMembers}
            initialInvitations={initialInvitations}
          />
        )}
      </div>
    </div>
  );
}
