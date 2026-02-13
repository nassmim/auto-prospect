import SmsConfigurationSection from "@/components/sms/SmsConfigurationSection";
import SmsTestSection from "@/components/sms/SmsTestSection";
import {
  hasSmsApiKeyAction,
  isSmsApiAllowedAction,
} from "@/services/message.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration SMS | Auto Prospect",
  description: "Configure ta clé API pour envoyer des SMS",
};

export default async function SmsSettingsPage() {
  // Fetch API key status and permission
  const [hasApiKey, isApiAllowed] = await Promise.all([
    hasSmsApiKeyAction(),
    isSmsApiAllowedAction(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <SmsConfigurationSection
          hasApiKey={hasApiKey}
          isApiAllowed={isApiAllowed}
        />
        <SmsTestSection hasApiKey={hasApiKey} />
      </div>
    </div>
  );
}
