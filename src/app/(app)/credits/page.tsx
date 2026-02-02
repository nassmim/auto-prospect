import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import Link from "next/link";

export const metadata = getSEOTags({
  title: "Credits",
  description: "Gérez vos crédits de contact pour SMS, WhatsApp et appels",
  canonical: pages.credits,
});

export default function CreditsPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            className="h-8 w-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title and description */}
        <h1 className="mb-3 text-3xl font-bold text-zinc-100">
          Gestion des crédits - Bientôt disponible
        </h1>
        <p className="mb-8 text-zinc-400">
          Achetez et gérez vos crédits pour contacter vos leads par SMS, WhatsApp
          et appels automatisés. Cette fonctionnalité sera bientôt disponible.
        </p>

        {/* Coming soon badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm font-medium text-amber-500">
            En cours de développement
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={pages.hunts.list}
            className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Voir les recherches
          </Link>
          <Link
            href={pages.dashboard}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Retour au dashboard
          </Link>
        </div>

        {/* Features preview */}
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-left">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Fonctionnalités à venir :
          </h2>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Achat de crédits par canal (SMS, WhatsApp, Ringless Voice)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Suivi en temps réel de la consommation de crédits</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Historique des transactions et factures</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Recharge automatique pour ne jamais être à court</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Tarifs dégressifs selon le volume</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
