import { getOrganizationHunts } from "@/actions/hunt-crud.actions";
import { HuntsView } from "@/components/hunts/hunts-view";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";

export const metadata = getSEOTags({
  title: "Recherches",
  description: "Gérez vos recherches automatiques de véhicules et suivez la prospection en temps réel",
  canonical: pages.hunts,
});

export default async function HuntsPage() {
  const hunts = await getOrganizationHunts();

  return <HuntsView hunts={hunts} />;
}
