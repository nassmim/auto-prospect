import { TemplatesView } from "@/components/templates/templates-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getAccountTemplates } from "@/services/message.service";

export const metadata = getSEOTags({
  title: "Templates de messages",
  description:
    "Créez et gérez vos templates pour WhatsApp, SMS et appels vocaux",
  canonical: pages.templates,
});

export default async function TemplatesPage() {
  const templates = await getAccountTemplates();

  return <TemplatesView templates={templates} />;
}
