import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pages } from "@/config/routes";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { Suspense, cache } from "react";

// Cache the auth check to make it compatible with Next.js 16 cacheComponents
const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  // Redirect to login if user is not authenticated
  if (!user) {
    redirect(pages.login);
  }

  return (
    <AppLayoutClient>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </AppLayoutClient>
  );
}
