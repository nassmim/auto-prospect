import { NewTemplateView } from "@/components/templates/new-template-view";
import { getSEOTags } from "@/lib/seo";
import { EContactChannel } from "@/config/message.config";
import type { Metadata } from "next";

type PageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { channel } = await searchParams;

  const isVoiceChannel = channel === EContactChannel.RINGLESS_VOICE;

  return getSEOTags({
    title: isVoiceChannel ? "Créer un template vocal" : "Créer un template texte",
    description: isVoiceChannel
      ? "Enregistrez ou importez un message vocal pour vos appels automatisés"
      : "Créez un message avec des variables personnalisables pour WhatsApp et SMS",
    canonical: `/templates/new${channel ? `?channel=${channel}` : ""}`,
  });
}

export default async function NewTemplatePage({ searchParams }: PageProps) {
  const { channel } = await searchParams;

  return <NewTemplateView channel={channel} />;
}
