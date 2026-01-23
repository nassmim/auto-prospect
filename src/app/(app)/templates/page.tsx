import { getOrganizationTemplates } from "@/actions/template.actions";
import { TemplatesView } from "@/components/templates/templates-view";
import { getSEOTags } from "@/lib/seo";

export const metadata = getSEOTags({
  title: "Templates de messages",
  description: "Créez et gérez vos templates pour WhatsApp, SMS et appels vocaux",
  canonical: "/templates",
});

export default async function TemplatesPage() {
  const templates = await getOrganizationTemplates();

  return <TemplatesView templates={templates} />;
}
