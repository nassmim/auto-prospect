// TODO: Uncomment when auth is implemented
// import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";
// import { pages } from "@/config/routes";
import { AppLayoutClient } from "@/components/layout/app-layout-client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Uncomment auth check when login/signup is implemented
  // const supabase = await createClient();
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();
  // if (!session) {
  //   redirect(pages.login);
  // }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
