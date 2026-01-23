import { StatCard } from "@/components/dashboard/stat-card";
import { HuntListItem } from "@/components/dashboard/hunt-list-item";
import { type DashboardStats, type HuntSummary } from "@/actions/dashboard.actions";
import Link from "next/link";

interface DashboardViewProps {
  stats: DashboardStats;
  hunts: HuntSummary[];
}

export function DashboardView({ stats, hunts }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>
        <Link
          href="/hunts/create"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
        >
          Nouvelle Recherche
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          }
          label="Nouveaux leads aujourd'hui"
          value={stats.newLeadsToday}
        />

        <StatCard
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Leads contactés"
          value={stats.leadsContacted}
        />

        <StatCard
          icon={
            <svg
              className="h-5 w-5"
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
          }
          label="Messages WhatsApp"
          value={stats.messagesSentByChannel.whatsapp}
        />

        <StatCard
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          label="Messages SMS"
          value={stats.messagesSentByChannel.sms}
        />
      </div>

      {/* Active Hunts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">
            Recherches actives
          </h2>
          <Link
            href="/hunts"
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            Voir tout
          </Link>
        </div>

        {hunts.length > 0 ? (
          <div className="space-y-3">
            {hunts.map((hunt) => (
              <HuntListItem key={hunt.id} hunt={hunt} />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <svg
                className="h-6 w-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-100">
              Aucune recherche active
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Créez votre première recherche pour commencer à trouver des leads
            </p>
            <Link
              href="/hunts/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Créer une recherche
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
