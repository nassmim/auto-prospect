import { SmsConnectionCard } from "./sms-connection-card";
import { WhatsAppConnectionCard } from "./whatsapp-connection-card";

type ConnectedAccountsTabProps = {
  accountId: string;
  whatsappPhoneNumber: string | null;
  whatsappConnected: boolean;
  whatsappDisconnected: boolean;
  smsApiKeyConfigured: boolean;
  smsApiAllowed: boolean;
};

/**
 * Connected Accounts Tab
 * Manages integrations with Leboncoin, WhatsApp, and SMS API
 */
export function ConnectedAccountsTab({
  accountId,
  whatsappPhoneNumber,
  whatsappConnected,
  whatsappDisconnected,
  smsApiKeyConfigured,
  smsApiAllowed,
}: ConnectedAccountsTabProps) {
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
            <strong className="text-zinc-300">Note:</strong> Installe
            l&apos;extension Chrome pour connecter ton compte Leboncoin et
            envoyer des messages automatiquement.
          </p>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <WhatsAppConnectionCard
        accountId={accountId}
        initialPhoneNumber={whatsappPhoneNumber}
        initialIsConnected={whatsappConnected}
        initialIsDisconnected={whatsappDisconnected}
      />

      {/* SMS API Connection */}
      <SmsConnectionCard
        initialHasApiKey={smsApiKeyConfigured}
        smsApiAllowed={smsApiAllowed}
      />
    </div>
  );
}
