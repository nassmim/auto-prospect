// TODO: Uncomment real data fetching when auth is implemented
// import { getOrganizationHunts } from "@/actions/hunt-crud.actions";
import { HuntsView } from "@/components/hunts/hunts-view";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";
import { mockOrganizationHunts } from "@/lib/mock-data";

export const metadata = getSEOTags({
  title: "Recherches",
  description: "Gérez vos recherches automatiques de véhicules et suivez la prospection en temps réel",
  canonical: pages.hunts,
});

export default async function HuntsPage() {
  // TODO: Replace with real data fetching
  // const hunts = await getOrganizationHunts();

  // Using mock data for testing without auth
  const hunts = mockOrganizationHunts;

  return <HuntsView hunts={hunts} />;
}
