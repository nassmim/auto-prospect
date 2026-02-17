import { NewTemplateView } from "@/components/templates/new-template-view";
import { pages } from "@/config/routes";
import { getSEOTags } from "@/lib/seo";
import { EContactChannel } from "@auto-prospect/shared/src/config/message.config";
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
    title: isVoiceChannel
      ? "Créer un template vocal"
      : "Créer un template texte",
    description: isVoiceChannel
      ? "Enregistre ou importe un message vocal pour tes appels automatisés"
      : "Crée un message avec des variables personnalisables pour WhatsApp",
    canonical: pages.templates.new(channel),
  });
}

export default async function NewTemplatePage({ searchParams }: PageProps) {
  const { channel } = await searchParams;

  return <NewTemplateView channel={channel} />;
}
