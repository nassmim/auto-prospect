"use client";

import { Button } from "@/components/ui/button";
import SmsApiKeyForm from "./SmsApiKeyForm";

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
            Pour accéder à la configuration SMS, contacte-nous pour activer
            cette fonctionnalité sur ton compte.
          </p>
          <Button onClick={handleContactClick} className="w-full sm:w-auto">
            Nous contacter
          </Button>
        </div>
      ) : (
        <>
          <p className="text-black mb-8">
            Configure ta clé API pour envoyer des SMS depuis ton mobile
          </p>

          <SmsApiKeyForm hasExistingKey={hasApiKey} />
        </>
      )}
    </div>
  );
}
