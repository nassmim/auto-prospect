import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayoutClient } from "@/components/layout/app-layout-client";

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
    redirect("/login");
  }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
