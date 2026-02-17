"use client";

import { deleteTemplate } from "@/actions/message.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MessageTemplate } from "@/services/message.service";
import {
  EContactChannel,
  getContactChannelConfig,
} from "@auto-prospect/shared/src/config/message.config";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TemplateCardProps = {
  template: MessageTemplate;
};

export function TemplateCard({ template }: TemplateCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Es-tu sûr de vouloir supprimer ce template ?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteTemplate(template.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("Erreur lors de la suppression du template");
      setIsDeleting(false);
    }
  };

  // Determine if this is a voice or text template based on channel
  const isVoiceTemplate = template.channel === EContactChannel.RINGLESS_VOICE;
  const channelConfig = getContactChannelConfig(template.channel);

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isVoiceTemplate ? (
              <svg
                className="h-5 w-5 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            {template.isDefault && (
              <Badge
                variant="outline"
                className="bg-amber-900/30 text-amber-500 border-amber-500/20"
              >
                Défaut
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>

        <h3 className="mt-3 font-semibold text-zinc-100">{template.name}</h3>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Channel badge */}
        <Badge variant="secondary" className="mb-2">
          {channelConfig.shortLabel}
        </Badge>

        {/* Content preview or audio duration */}
        {!isVoiceTemplate && template.content ? (
          <p className="line-clamp-2 text-sm text-zinc-400">
            {template.content}
          </p>
        ) : isVoiceTemplate && template.audioDuration ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{template.audioDuration}s</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="border-t pt-3 text-xs text-zinc-500">
        Créé par {template.account.name}
      </CardFooter>
    </Card>
  );
}
