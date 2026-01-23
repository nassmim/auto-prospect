import { getDashboardStats, getActiveHunts } from "@/actions/dashboard.actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";

export const metadata = getSEOTags({
  title: "Dashboard",
  description: "Vue d'ensemble de votre activité de prospection : leads, messages et recherches actives",
  canonical: pages.dashboard,
});

export default async function DashboardPage() {
  // Fetch data in parallel for better performance
  const [stats, hunts] = await Promise.all([
    getDashboardStats(),
    getActiveHunts(),
  ]);

  return <DashboardView stats={stats} hunts={hunts} />;
}
