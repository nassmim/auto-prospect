import Link from "next/link";
import { HuntForm } from "@/components/hunts/hunt-form";
import { pages } from "@/config/routes";

export function NewHuntView() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href={pages.hunts}
            className="text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Recherches
          </Link>
          <svg
            className="h-4 w-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-100">Nouvelle recherche</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-zinc-100">
            Créer une recherche
          </h1>
          <p className="text-sm text-zinc-400">
            Définissez les critères pour trouver automatiquement des véhicules à contacter
          </p>
        </div>

        {/* Form */}
        <HuntForm />
      </div>
    </div>
  );
}
