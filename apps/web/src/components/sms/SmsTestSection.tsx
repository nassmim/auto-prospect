"use client";

import { sendSmsAction } from "@/actions/message.actions";
import { getErrorMessage } from "@/utils/error-messages.utils";
import { useState } from "react";

type SmsTestSectionProps = {
  hasApiKey: boolean;
};

export default function SmsTestSection({ hasApiKey }: SmsTestSectionProps) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    errorCode?: import("@/config/error-codes").TErrorCode;
  } | null>(null);

  const handleSendTestSms = async () => {
    if (!recipientPhone || !messageText) return;

    setSendingMessage(true);
    setSendResult(null);

    const result = await sendSmsAction({
      to: recipientPhone,
      message: messageText,
    });

    setSendResult(result);
    setSendingMessage(false);

    // If successful, clear the form
    if (result.success) {
      setRecipientPhone("");
      setMessageText("");
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-8 ${!hasApiKey ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            hasApiKey ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          2
        </div>
        <h2 className="text-xl font-bold text-black">Envoyer un SMS de test</h2>
      </div>

      {hasApiKey ? (
        <div className="space-y-4">
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800">
              ⚠️ Attention : cela utilise ton forfait mobile avec ta carte SIM
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">
              Numéro destinataire
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+33612345678"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <p className="mt-1 text-xs text-black">
              Format international (ex: +33612345678)
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">
              Message
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Bonjour, ceci est un message de test..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <button
            onClick={handleSendTestSms}
            disabled={sendingMessage || !recipientPhone || !messageText}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sendingMessage ? "Envoi en cours..." : "Envoyer le SMS"}
          </button>

          {sendResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                sendResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {sendResult.success
                ? "✓ SMS envoyé avec succès !"
                : `✗ Erreur: ${sendResult.errorCode ? getErrorMessage(sendResult.errorCode) : "Échec de l'envoi du SMS"}`}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-black">
          Configure d&apos;abord ta clé API pour envoyer des SMS
        </p>
      )}
    </div>
  );
}
