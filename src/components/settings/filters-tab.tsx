"use client";

import { useState, useTransition } from "react";
import { updateOrganizationSettings } from "@/actions/organization.actions";
import type { OrganizationSettings } from "@/schema/organization.schema";

type FiltersTabProps = {
  settings: OrganizationSettings | null;
};

/**
 * Filters Tab
 * Manages professional rejection filters
 */
export function FiltersTab({ settings }: FiltersTabProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Currently there's no specific professional filter flag in the schema
  // This is a placeholder for future implementation
  const [rejectProfessionals, setRejectProfessionals] = useState(false);

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updateOrganizationSettings({
          // Store filter preferences (to be implemented in schema)
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Filtres de recherche
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configurez les filtres appliqués automatiquement à vos recherches
        </p>
      </div>

      {/* Professional Rejection Filter */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-zinc-100">
                Refus des professionnels
              </h3>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={rejectProfessionals}
                  onChange={(e) => setRejectProfessionals(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:bg-zinc-950 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2 peer-focus:ring-offset-zinc-950"></div>
              </label>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Filtre automatiquement les annonces contenant des termes
              indiquant un vendeur professionnel
            </p>

            {/* Examples */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                Exemples de termes filtrés:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "pas d'agence",
                  "particulier seulement",
                  "sans garage",
                  "vente directe",
                  "propriétaire",
                ].map((term) => (
                  <span
                    key={term}
                    className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-300">
              À propos des filtres
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Les filtres sont appliqués en temps réel lors de la recherche
              d&apos;annonces. Ils permettent de cibler uniquement les vendeurs
              particuliers et d&apos;éviter les professionnels.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-500">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Paramètres enregistrés
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
