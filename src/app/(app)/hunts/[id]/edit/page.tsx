import { EditHuntView } from "@/components/hunts/edit-hunt-view";
import { getHuntById } from "@/services/hunt.service";
import { getAccountTemplates } from "@/services/message.service";
import { getSEOTags } from "@/lib/seo";
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
    description: "Modifiez les paramètres de votre recherche",
  });
}

export default async function EditHuntPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let hunt;
  try {
    hunt = await getHuntById(id);
  } catch (error) {
    notFound();
  }

  const templates = await getAccountTemplates();

  return <EditHuntView hunt={hunt} templates={templates} />;
}
