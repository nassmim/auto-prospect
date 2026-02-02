// TODO: Uncomment real data fetching when auth is implemented
// import { getaccountHunts } from "@/actions/hunt-crud.actions";
import { HuntsView } from "@/components/hunts/hunts-view";
import { pages } from "@/config/routes";
import { mockaccountHunts } from "@/lib/mock-data";
import { getSEOTags } from "@/lib/seo";

export const metadata = getSEOTags({
  title: "Recherches",
  description:
    "Gérez vos recherches automatiques de véhicules et suivez la prospection en temps réel",
  canonical: pages.hunts,
});

export default async function HuntsPage() {
  // TODO: Replace with real data fetching
  // const hunts = await getaccountHunts();

  // Using mock data for testing without auth
  const hunts = mockaccountHunts;

  return <HuntsView hunts={hunts} />;
}
