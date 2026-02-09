"use client";

import { saveSmsApiKeyAction } from "@/actions/message.actions";
import { getErrorMessage } from "@/utils/error-messages.utils";
import { useState } from "react";

type SmsConnectionCardProps = {
  initialHasApiKey: boolean;
  smsApiAllowed: boolean;
};

/**
 * SMS Connection Card
 * Handles SMS Mobile API key configuration
 */
export function SmsConnectionCard({
  initialHasApiKey,
  smsApiAllowed,
}: SmsConnectionCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSaveApiKey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveSmsApiKeyAction({
      apiKey: apiKey.trim(),
    });

    if (result.success) {
      setHasApiKey(true);
      setApiKey("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(
        result.errorCode
          ? getErrorMessage(result.errorCode)
          : "Erreur lors de la sauvegarde",
      );
    }
    setLoading(false);
  };

  const handleContactClick = () => {
    // TODO: Implement email alert functionality
    console.log("Contact button clicked - email alert to be implemented");
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
            <svg
              className="h-6 w-6 text-blue-500"
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
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100">
              SMS Mobile API
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Envoie des SMS depuis ton téléphone
            </p>
            <div className="mt-2 flex items-center gap-2">
              {hasApiKey ? (
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
                  Connecté
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-zinc-600" />
                  Non configuré
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Not Allowed - Show Contact Button */}
      {!smsApiAllowed && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Pour accéder à la configuration SMS, contactez-nous pour activer
            cette fonctionnalité sur votre compte.
          </p>
          <button
            onClick={handleContactClick}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Nous contacter
          </button>
        </div>
      )}

      {/* Allowed - Show API Key Configuration */}
      {smsApiAllowed && (
        <>
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {hasApiKey
                ? "Clé API mise à jour avec succès"
                : "Clé API enregistrée avec succès"}
            </div>
          )}

          {/* API Key Configuration */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  hasApiKey
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {hasApiKey ? "✓" : "1"}
              </div>
              <h4 className="text-sm font-medium text-zinc-200">
                Clé API SMS Mobile
              </h4>
            </div>

            <div className="ml-10 space-y-3">
              {hasApiKey && (
                <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="text-xs text-blue-400">
                    <strong className="text-blue-300">
                      Clé API déjà configurée
                    </strong>
                    <br />
                    Tu peux mettre à jour ta clé API en entrant une nouvelle clé
                    ci-dessous.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Entre ta clé API SMS Mobile"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={loading || !apiKey.trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? "..." : hasApiKey ? "Mettre à jour" : "Connecter"}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <h5 className="mb-3 text-xs font-semibold text-zinc-300">
              Comment obtenir ta clé API ?
            </h5>

            <div className="space-y-3 text-xs text-zinc-400">
              {/* Android Method */}
              <div>
                <p className="mb-1.5 font-medium text-zinc-300">
                  📱 Via application Android :
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Ouvre l&apos;application SMS Mobile</li>
                  <li>
                    Va dans <span className="text-zinc-300">Help Center</span> →{" "}
                    <span className="text-zinc-300">API Key</span>
                  </li>
                  <li>Copie ta clé API et colle-la ci-dessus</li>
                </ol>
              </div>

              {/* Web Method */}
              <div>
                <p className="mb-1.5 font-medium text-zinc-300">
                  💻 Via ordinateur :
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Connecte-toi sur le site SMS Mobile API</li>
                  <li>
                    Va dans <span className="text-zinc-300">Dashboard</span> →{" "}
                    <span className="text-zinc-300">My API Key</span>
                  </li>
                  <li>Copie ta clé API et colle-la ci-dessus</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
