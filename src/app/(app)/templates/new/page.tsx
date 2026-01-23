import { NewTemplateView } from "@/components/templates/new-template-view";
import { getSEOTags } from "@/lib/seo";
import type { Metadata } from "next";

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { type = "text" } = await searchParams;

  const isTextTemplate = type === "text";

  return getSEOTags({
    title: isTextTemplate ? "Créer un template texte" : "Créer un template vocal",
    description: isTextTemplate
      ? "Créez un message avec des variables personnalisables pour WhatsApp et SMS"
      : "Enregistrez ou importez un message vocal pour vos appels automatisés",
    canonical: `/templates/new?type=${type}`,
  });
}

export default async function NewTemplatePage({ searchParams }: PageProps) {
  const { type = "text" } = await searchParams;

  return <NewTemplateView type={type} />;
}
