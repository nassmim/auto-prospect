"use client";

import { useState } from "react";
import { saveSmsApiKeyAction } from "@/actions/messaging.actions";

type SmsApiKeyFormProps = {
  accountId: string;
  hasExistingKey?: boolean;
  onSuccess?: () => void;
};

export default function SmsApiKeyForm({ accountId, hasExistingKey = false, onSuccess }: SmsApiKeyFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!hasExistingKey);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await saveSmsApiKeyAction({
      accountId,
      apiKey: apiKey.trim(),
    });

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Ta clé a bien été sauvegardée" });
      setApiKey(""); // Clear input on success
      setIsEditing(false); // Exit editing mode
      onSuccess?.();
    } else {
      setMessage({ type: "error", text: result.error || "Une erreur est survenue" });
    }

    // Auto-hide message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setApiKey(""); // Clear the field when entering edit mode
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setApiKey("");
    setMessage(null);
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-black mb-2">
            Ta clé api
          </label>
          <input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasExistingKey && !isEditing ? "Clé API déjà configurée" : "Entrer ta clé API SMS Mobile API"}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              hasExistingKey && !isEditing ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            disabled={loading || (hasExistingKey && !isEditing)}
          />
        </div>

        <div className="flex gap-2">
          {hasExistingKey && !isEditing ? (
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Modifier
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Enregistrement..." : hasExistingKey ? "Enregistrer" : "Connecter"}
            </button>
          )}
        </div>
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
