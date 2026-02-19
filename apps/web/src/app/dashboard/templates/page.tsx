import { TemplatesView } from "@/components/templates/templates-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getAccountTemplates } from "@/services/message.service";

export const metadata = getSEOTags({
  title: "Templates de messages",
  description: "Crée et gère tes templates pour WhatsApp et appels vocaux",
  canonical: pages.templates.list,
});

export default async function TemplatesPage() {
  const templates = await getAccountTemplates();

  return <TemplatesView templates={templates} />;
}
