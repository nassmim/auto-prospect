import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { pages } from "@/config/routes";
import { getUserAccount } from "@/services/account.service";
import { isWhatsAppDisconnected } from "@/services/whatsapp.service";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserAccount(undefined, { columnsToKeep: { id: true } });

  // Redirect to login if user is not authenticated
  if (!user || !user.id) redirect(pages.login);

  // Check if WhatsApp is disconnected
  const whatsappDisconnected = await isWhatsAppDisconnected(user.id);

  return (
    <AppLayoutClient whatsappDisconnected={whatsappDisconnected}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </AppLayoutClient>
  );
}
