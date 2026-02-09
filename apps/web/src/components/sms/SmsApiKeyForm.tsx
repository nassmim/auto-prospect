"use client";

import { saveSmsApiKeyAction } from "@/actions/message.actions";
import { getErrorMessage } from "@/utils/error-messages.utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SmsApiKeyFormProps = {
  hasExistingKey?: boolean;
};

export default function SmsApiKeyForm({
  hasExistingKey = false,
}: SmsApiKeyFormProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await saveSmsApiKeyAction({
      apiKey: apiKey.trim(),
    });

    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: hasExistingKey
          ? "Ta clé a bien été mise à jour"
          : "Ta clé a bien été sauvegardée",
      });
      setApiKey(""); // Clear input on success
      router.refresh(); // Refresh server component data
    } else {
      setMessage({
        type: "error",
        text: result.errorCode
          ? getErrorMessage(result.errorCode)
          : "Une erreur est survenue",
      });
    }

    // Auto-hide message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="w-full max-w-md">
      {hasExistingKey && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Clé API déjà configurée</p>
            <p className="text-blue-700 mt-0.5">
              Tu peux mettre à jour ta clé API en entrant une nouvelle clé
              ci-dessous.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-black mb-2"
          >
            Ta clé api
          </label>
          <input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Entrer ta clé API"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Enregistrement..."
            : hasExistingKey
              ? "Mettre à jour"
              : "Connecter"}
        </button>
      </form>

      {/* Message display */}
      {message && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
