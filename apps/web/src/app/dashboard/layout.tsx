import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { AppLayoutSkeleton } from "@/components/layout/app-layout-skeleton";
import { getUserAccount } from "@/services/account.service";
import { isWhatsAppDisconnected } from "@/services/whatsapp.service";
import { Suspense } from "react";

async function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getUserAccount(undefined, {
    columnsToKeep: { id: true },
  });

  // Check if WhatsApp is disconnected
  const whatsappDisconnected = await isWhatsAppDisconnected(account.id);

  return (
    <AppLayoutClient whatsappDisconnected={whatsappDisconnected}>
      {children}
    </AppLayoutClient>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppLayoutSkeleton>{children}</AppLayoutSkeleton>}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
