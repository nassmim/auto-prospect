"use client";

import SmsApiKeyForm from "./SmsApiKeyForm";
import { Button } from "@/components/ui/button";

type SmsConfigurationSectionProps = {
  hasApiKey: boolean;
  isApiAllowed: boolean;
};

export default function SmsConfigurationSection({
  hasApiKey,
  isApiAllowed,
}: SmsConfigurationSectionProps) {
  const handleContactClick = () => {
    // TODO: Implement email alert functionality
    console.log("Contact button clicked - email alert to be implemented");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            hasApiKey ? "bg-green-100 text-green-700" : "bg-gray-900 text-white"
          }`}
        >
          {hasApiKey ? "✓" : "1"}
        </div>
        <h1 className="text-2xl font-bold text-black">Configuration SMS</h1>
      </div>

      {!isApiAllowed ? (
        <div className="space-y-6">
          <p className="text-black">
            Pour accéder à la configuration SMS, contactez-nous pour activer
            cette fonctionnalité sur votre compte.
          </p>
          <Button onClick={handleContactClick} className="w-full sm:w-auto">
            Nous contacter
          </Button>
        </div>
      ) : (
        <>
          <p className="text-black mb-8">
            Configure ta clé API SMS Mobile API pour envoyer des SMS
          </p>

          <SmsApiKeyForm hasExistingKey={hasApiKey} />

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              Comment obtenir ta clé API SMS Mobile ?
            </h3>

            <div className="space-y-4 text-sm text-blue-800">
              {/* Méthode 1: Android */}
              <div>
                <p className="font-semibold mb-2">📱 Via application Android :</p>
                <ol className="space-y-1 list-decimal list-inside pl-2">
                  <li>Ouvre l&apos;application SMS Mobile</li>
                  <li>
                    Va dans <span className="font-medium">Help Center</span> →{" "}
                    <span className="font-medium">API Key</span>
                  </li>
                  <li>Copie ta clé API et colle-la dans le champ ci-dessus</li>
                </ol>
              </div>

              {/* Méthode 2: PC */}
              <div>
                <p className="font-semibold mb-2">💻 Via ordinateur :</p>
                <ol className="space-y-1 list-decimal list-inside pl-2">
                  <li>Connecte-toi sur le site SMS Mobile API</li>
                  <li>
                    Va dans <span className="font-medium">Dashboard</span> →{" "}
                    <span className="font-medium">My API Key</span>
                  </li>
                  <li>Copie ta clé API et colle-la dans le champ ci-dessus</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
