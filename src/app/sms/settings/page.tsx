import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSmsApiKeyAction } from "@/actions/messaging.actions";
import SmsConfigurationSection from "@/components/sms/SmsConfigurationSection";
import SmsTestSection from "@/components/sms/SmsTestSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration SMS | Auto Prospect",
  description: "Configure ta clé API SMS Mobile pour envoyer des SMS",
};

export default async function SmsSettingsPage() {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch API key status
  const hasApiKey = await hasSmsApiKeyAction(user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <SmsConfigurationSection accountId={user.id} hasApiKey={hasApiKey} />
        <SmsTestSection accountId={user.id} hasApiKey={hasApiKey} />
      </div>
    </div>
  );
}
