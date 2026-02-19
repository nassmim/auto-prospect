import { TextTemplateForm } from "@/components/templates/text-template-form";
import { VoiceTemplateForm } from "@/components/templates/voice-template-form";
import { pages } from "@/config/routes";
import { EContactChannel } from "@auto-prospect/shared/src/config/message.config";
import Link from "next/link";

interface NewTemplateViewProps {
  channel?: string;
}

export function NewTemplateView({ channel }: NewTemplateViewProps) {
  // Determine if this is a voice channel (ringless_voice) or text channel (sms, whatsapp_text)
  const isVoiceChannel = channel === EContactChannel.RINGLESS_VOICE;
  const isTextChannel =
    channel === EContactChannel.SMS ||
    channel === EContactChannel.WHATSAPP_TEXT;

  // Default to text if no channel specified
  const showTextForm = !channel || isTextChannel;
  const showVoiceForm = isVoiceChannel;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href={pages.templates.list}
            className="text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Templates
          </Link>
          <svg
            className="h-4 w-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-100">
            {showVoiceForm
              ? "Nouveau template vocal"
              : "Nouveau template texte"}
          </span>
        </nav>

        {/* Header with type selector */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-zinc-100">
            Créer un template
          </h1>
          <p className="text-sm text-zinc-400">
            {showVoiceForm
              ? "Enregistre ou importe un message vocal pour tes appels"
              : "Crée un message avec des variables personnalisables pour WhatsApp"}
          </p>

          {/* Type tabs */}
          <div className="mt-6 flex gap-2">
            <Link
              href={pages.templates.new(EContactChannel.WHATSAPP_TEXT)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                showTextForm
                  ? "border-amber-500 bg-amber-500/10 text-amber-500"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Template Texte
              </div>
            </Link>
            <Link
              href={pages.templates.new(EContactChannel.RINGLESS_VOICE)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                showVoiceForm
                  ? "border-amber-500 bg-amber-500/10 text-amber-500"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Template Vocal
              </div>
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          {showVoiceForm ? (
            <VoiceTemplateForm defaultChannel={channel} />
          ) : (
            <TextTemplateForm defaultChannel={channel} />
          )}
        </div>
      </div>
    </div>
  );
}
