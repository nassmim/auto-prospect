"use client";

/**
 * Connected Accounts Tab
 * Manages integrations with Leboncoin, WhatsApp, and SMS API
 */
export function ConnectedAccountsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Comptes connectés
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gérez vos connexions aux plateformes d&apos;envoi de messages
        </p>
      </div>

      {/* Leboncoin Connection */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">Leboncoin</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Extension Chrome pour l&apos;envoi de messages
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-zinc-600" />
                  Non connecté
                </span>
              </div>
            </div>
          </div>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
          >
            Installer l&apos;extension
          </a>
        </div>
        <div className="mt-4 rounded-lg bg-zinc-800/50 p-4">
          <p className="text-xs text-zinc-400">
            <strong className="text-zinc-300">Note:</strong> Installez
            l&apos;extension Chrome pour connecter votre compte Leboncoin et
            envoyer des messages automatiquement.
          </p>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <svg
                className="h-6 w-6 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">WhatsApp</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Intégration directe WhatsApp Business
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                  Bientôt disponible
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-zinc-800/50 p-4">
          <p className="text-xs text-zinc-400">
            L&apos;intégration directe WhatsApp Business API sera disponible
            prochainement. Pour l&apos;instant, utilisez l&apos;extension
            Chrome.
          </p>
        </div>
      </div>

      {/* SMS API Connection */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
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
                Configuration de l&apos;API SMS Mobile
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="sms-api-key"
              className="block text-sm font-medium text-zinc-300"
            >
              Clé API
            </label>
            <input
              id="sms-api-key"
              type="password"
              placeholder="Entrez votre clé API SMS Mobile"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
