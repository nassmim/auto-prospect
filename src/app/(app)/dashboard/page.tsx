// TODO: Uncomment real data fetching when auth is implemented
// import { getDashboardStats, getActiveHunts } from "@/actions/dashboard.actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";
import { mockDashboardStats, mockHunts } from "@/lib/mock-data";

export const metadata = getSEOTags({
  title: "Dashboard",
  description: "Vue d'ensemble de votre activité de prospection : leads, messages et recherches actives",
  canonical: pages.dashboard,
});

export default async function DashboardPage() {
  // TODO: Replace with real data fetching
  // const [stats, hunts] = await Promise.all([
  //   getDashboardStats(),
  //   getActiveHunts(),
  // ]);

  // Using mock data for testing without auth
  const stats = mockDashboardStats;
  const hunts = mockHunts;

  return <DashboardView stats={stats} hunts={hunts} />;
}
