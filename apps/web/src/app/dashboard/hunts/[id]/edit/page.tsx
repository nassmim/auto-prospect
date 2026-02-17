import { EditHuntView } from "@/components/hunts/edit-hunt-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { getHuntById } from "@/services/hunt.service";
import { getAccountTemplates } from "@/services/message.service";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hunt = await getHuntById(id);

  return getSEOTags({
    title: `Modifier ${hunt.name}`,
    description: "Modifie les paramètres de ton recherche",
    canonical: pages.hunts.edit(id),
  });
}

export default async function EditHuntPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallelize independent data fetches for faster page load
  const [huntResult, templates] = await Promise.all([
    getHuntById(id).catch(() => null),
    getAccountTemplates(),
  ]);

  if (!huntResult) {
    notFound();
  }

  return <EditHuntView hunt={huntResult} templates={templates} />;
}
