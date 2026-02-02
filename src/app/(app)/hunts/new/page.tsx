import { NewHuntView } from "@/components/hunts/new-hunt-view";
import { getSEOTags } from "@/lib/seo";
import { pages } from "@/config/routes";
import { getAccountTemplates } from "@/services/message.service";

export const metadata = getSEOTags({
  title: "Créer une recherche",
  description: "Définissez les critères pour trouver automatiquement des véhicules à contacter",
  canonical: pages.hunts.new,
});

export default async function NewHuntPage() {
  const templates = await getAccountTemplates();
  return <NewHuntView templates={templates} />;
}
