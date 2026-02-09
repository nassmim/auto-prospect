import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { pages } from "@/config/routes";
import { getUserAccount } from "@/services/account.service";
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

  return (
    <AppLayoutClient>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </AppLayoutClient>
  );
}
