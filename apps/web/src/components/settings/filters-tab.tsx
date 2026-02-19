"use client";

import { updateAccountSettings } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TAccountSettings } from "@/types/account.types";
import { accountSettingsSchema } from "@/validation-schemas";
import { useState, useTransition } from "react";

type FiltersTabProps = {
  settings: TAccountSettings | null;
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

    const validationResult = accountSettingsSchema.partial().safeParse({
      // Future: add rejectProfessionals field when schema is updated
    });

    if (!validationResult.success) {
      setError("Validation des paramètres a échoué");
      return;
    }

    startTransition(async () => {
      try {
        await updateAccountSettings({
          // Store filter preferences (to be implemented in schema)
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
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
          Configure les filtres appliqués automatiquement à tes recherches
        </p>
      </div>

      {/* Professional Rejection Filter */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Checkbox
                id="reject-professionals"
                checked={rejectProfessionals}
                onCheckedChange={(checked) =>
                  setRejectProfessionals(checked === true)
                }
              />
              <label
                htmlFor="reject-professionals"
                className="cursor-pointer text-sm font-medium text-zinc-100"
              >
                Refus des professionnels
              </label>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Filtre automatiquement les annonces contenant des termes indiquant
              un vendeur professionnel
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
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>

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
