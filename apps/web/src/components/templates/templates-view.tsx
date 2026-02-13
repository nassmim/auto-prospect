import { TemplateCard } from "@/components/templates/template-card";
import { pages } from "@/config/routes";
import { MessageTemplate } from "@/services/message.service";
import { EContactChannel } from "@auto-prospect/shared/src/config/message.config";
import Link from "next/link";

interface TemplatesViewProps {
  templates: MessageTemplate[];
}

export function TemplatesView({ templates }: TemplatesViewProps) {
  // Group templates by media type: text channels (SMS, WhatsApp) vs voice channels (Ringless Voice)
  const textTemplates = templates.filter(
    (t) =>
      t.channel === EContactChannel.SMS ||
      t.channel === EContactChannel.WHATSAPP_TEXT,
  );
  const voiceTemplates = templates.filter(
    (t) => t.channel === EContactChannel.RINGLESS_VOICE,
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Templates de messages
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Créez et gérez vos templates pour WhatsApp, SMS et appels vocaux
            </p>
          </div>

          {/* New template button */}
          <Link
            href={pages.templates.new(EContactChannel.WHATSAPP_TEXT)}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400"
          >
            + Nouveau Template
          </Link>
        </div>

        {/* Templates sections */}
        <div className="space-y-8">
          {/* Text templates */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Templates Texte ({textTemplates.length})
              </h2>
              <Link
                href={pages.templates.new(EContactChannel.WHATSAPP_TEXT)}
                className="text-sm text-amber-500 transition-colors hover:text-amber-400"
              >
                + Ajouter un template texte
              </Link>
            </div>

            {textTemplates.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  Aucun template texte créé
                </p>
                <Link
                  href={pages.templates.new(EContactChannel.WHATSAPP_TEXT)}
                  className="mt-4 inline-block rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  Créer votre premier template
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {textTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </section>

          {/* Voice templates */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Templates Voix ({voiceTemplates.length})
              </h2>
              <Link
                href={pages.templates.new(EContactChannel.RINGLESS_VOICE)}
                className="text-sm text-amber-500 transition-colors hover:text-amber-400"
              >
                + Ajouter un template voix
              </Link>
            </div>

            {voiceTemplates.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  Aucun template vocal créé
                </p>
                <Link
                  href={pages.templates.new(EContactChannel.RINGLESS_VOICE)}
                  className="mt-4 inline-block rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  Créer votre premier template vocal
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {voiceTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
