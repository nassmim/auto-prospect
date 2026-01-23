import Link from "next/link";
import { TextTemplateForm } from "@/components/templates/text-template-form";
import { VoiceTemplateForm } from "@/components/templates/voice-template-form";

interface NewTemplateViewProps {
  type: string;
}

export function NewTemplateView({ type }: NewTemplateViewProps) {
  const isTextTemplate = type === "text";
  const isVoiceTemplate = type === "voice";

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/templates"
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
            {isTextTemplate ? "Nouveau template texte" : "Nouveau template vocal"}
          </span>
        </nav>

        {/* Header with type selector */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-zinc-100">
            Créer un template
          </h1>
          <p className="text-sm text-zinc-400">
            {isTextTemplate
              ? "Créez un message avec des variables personnalisables"
              : "Enregistrez ou importez un message vocal pour vos appels"}
          </p>

          {/* Type tabs */}
          <div className="mt-6 flex gap-2">
            <Link
              href="/templates/new?type=text"
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isTextTemplate
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
              href="/templates/new?type=voice"
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isVoiceTemplate
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
          {isTextTemplate ? <TextTemplateForm /> : <VoiceTemplateForm />}
        </div>
      </div>
    </div>
  );
}
