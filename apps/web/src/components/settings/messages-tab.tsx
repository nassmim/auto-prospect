"use client";

import { updateAccountSettings } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TAccountSettings } from "@/types/account.types";
import { accountSettingsSchema } from "@/validation-schemas";
import { useState, useTransition } from "react";

type MessagesTabProps = {
  settings: TAccountSettings | null;
};

/**
 * Messages Tab
 * Manages message settings like daily reset and phone visibility filtering
 */
export function MessagesTab({ settings }: MessagesTabProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize from settings
  const [dailyReset, setDailyReset] = useState(settings?.dailyReset ?? false);
  const [ignorePhonesVisible, setIgnorePhonesVisible] = useState(
    settings?.ignorePhonesVisible ?? false,
  );

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    const validationResult = accountSettingsSchema.safeParse({
      dailyReset,
      ignorePhonesVisible,
    });

    if (!validationResult.success) {
      setError("Validation des paramètres a échoué");
      return;
    }

    startTransition(async () => {
      try {
        await updateAccountSettings(validationResult.data);
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
          Paramètres des messages
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configurez le comportement de l&apos;envoi automatique de messages
        </p>
      </div>

      {/* Daily Reset Setting */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <svg
                  className="h-5 w-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <label htmlFor="daily-reset" className="cursor-pointer">
                  <h3 className="text-sm font-medium text-zinc-100">
                    Réinitialisation quotidienne
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Réinitialise les compteurs de messages à minuit chaque jour
                  </p>
                </label>
              </div>
              <Checkbox
                id="daily-reset"
                checked={dailyReset}
                onCheckedChange={(checked) => setDailyReset(checked === true)}
              />
            </div>
            <div className="mt-4 rounded-lg bg-zinc-800/50 p-3">
              <p className="text-xs text-zinc-400">
                Lorsque activée, cette option permet de respecter les limites
                quotidiennes d&apos;envoi de messages imposées par les
                plateformes (Leboncoin, WhatsApp, etc.)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ignore Phone Visible Setting */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <svg
                  className="h-5 w-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="ignore-phones-visible"
                  className="cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-zinc-100">
                    Ignorer les annonces avec téléphone visible
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Ne pas envoyer de messages automatiques aux annonces qui
                    affichent déjà un numéro de téléphone
                  </p>
                </label>
              </div>
              <Checkbox
                id="ignore-phones-visible"
                checked={ignorePhonesVisible}
                onCheckedChange={(checked) =>
                  setIgnorePhonesVisible(checked === true)
                }
              />
            </div>
            <div className="mt-4 rounded-lg bg-zinc-800/50 p-3">
              <p className="text-xs text-zinc-400">
                Recommandé pour éviter les messages redondants. Si le vendeur
                affiche déjà son numéro, tu peux le contacter directement sans
                passer par la messagerie automatique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-500"
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
              Bonnes pratiques
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                <span>
                  Respectez les limites d&apos;envoi pour éviter d&apos;être
                  bloqué
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                <span>
                  Personnalise tes templates de messages pour de meilleurs
                  résultats
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                <span>Vérifie régulièrement tes paramètres de connexion</span>
              </li>
            </ul>
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
