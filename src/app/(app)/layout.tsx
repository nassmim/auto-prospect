import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { pages } from "@/config/routes";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(pages.login);
  }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
