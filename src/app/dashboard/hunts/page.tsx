import { HuntsView } from "@/components/hunts/hunts-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getAccountHunts } from "@/services/hunt.service";

export const metadata = getSEOTags({
  title: "Recherches",
  description:
    "Gérez vos recherches automatiques de véhicules et suivez la prospection en temps réel",
  canonical: pages.hunts.list,
});

export default async function HuntsPage() {
  const hunts = await getAccountHunts();

  return <HuntsView hunts={hunts} />;
}
