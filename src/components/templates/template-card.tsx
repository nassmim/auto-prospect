"use client";

import { useState } from "react";
import { deleteTemplate } from "@/actions/template.actions";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  type: "text" | "voice";
  channel: string | null;
  content: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  isDefault: boolean;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
};

type TemplateCardProps = {
  template: Template;
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  leboncoin: "Leboncoin",
};

export function TemplateCard({ template }: TemplateCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
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

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      {/* Type badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {template.type === "text" ? (
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
          ) : (
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
          )}
          {template.isDefault && (
            <span className="rounded bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-500">
              Défaut
            </span>
          )}
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
        >
          <svg
            className="h-5 w-5 text-zinc-500 transition-colors hover:text-red-400"
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
        </button>
      </div>

      {/* Template name */}
      <h3 className="mb-2 font-semibold text-zinc-100">{template.name}</h3>

      {/* Channel badge for text templates */}
      {template.channel && (
        <div className="mb-2">
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
            {CHANNEL_LABELS[template.channel]}
          </span>
        </div>
      )}

      {/* Content preview or audio duration */}
      {template.type === "text" && template.content ? (
        <p className="line-clamp-2 text-sm text-zinc-400">
          {template.content}
        </p>
      ) : template.type === "voice" && template.audioDuration ? (
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

      {/* Footer */}
      <div className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        Créé par {template.createdBy.name}
      </div>
    </div>
  );
}
