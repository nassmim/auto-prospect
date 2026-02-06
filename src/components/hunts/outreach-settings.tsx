"use client";

import { EContactChannel } from "@/config/message.config";
import { pages } from "@/config/routes";
import { getAccountTemplates } from "@/services/message.service";

type OutreachSettingsProps = {
  templates: Awaited<ReturnType<typeof getAccountTemplates>>;
  outreachSettings: {
    leboncoin?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    ringlessVoice?: boolean;
  };
  templateIds: {
    leboncoin?: string | null;
    whatsapp?: string | null;
    sms?: string | null;
    ringlessVoice?: string | null;
  };
  channelCredits?: {
    sms?: number;
    whatsapp?: number;
    ringlessVoice?: number;
  };
  onOutreachChange: (
    settings: OutreachSettingsProps["outreachSettings"],
  ) => void;
  onTemplateChange: (templateIds: OutreachSettingsProps["templateIds"]) => void;
  onChannelCreditsChange?: (
    credits: OutreachSettingsProps["channelCredits"],
  ) => void;
};

export function OutreachSettings({
  templates,
  outreachSettings,
  templateIds,
  channelCredits,
  onOutreachChange,
  onTemplateChange,
  onChannelCreditsChange,
}: OutreachSettingsProps) {
  const handleToggle = (
    channel: "leboncoin" | "whatsapp" | "sms" | "ringlessVoice",
  ) => {
    onOutreachChange({
      ...outreachSettings,
      [channel]: !outreachSettings[channel],
    });
  };

  const handleTemplateChange = (
    channel: "leboncoin" | "whatsapp" | "sms" | "ringlessVoice",
    templateId: string,
  ) => {
    onTemplateChange({
      ...templateIds,
      [channel]: templateId || null,
    });
  };

  const handleCreditsChange = (
    channel: "sms" | "whatsapp" | "ringlessVoice",
    credits: number,
  ) => {
    if (onChannelCreditsChange) {
      onChannelCreditsChange({
        ...channelCredits,
        [channel]: credits,
      });
    }
  };

  // Filter templates by channel and type
  const getTemplatesForChannel = (
    channel: "leboncoin" | "whatsapp" | "sms" | "ringlessVoice",
  ) => {
    if (channel === "leboncoin") {
      // Leboncoin doesn't have templates in the current schema - return empty
      return [];
    } else if (channel === "whatsapp") {
      // WhatsApp text templates (channel === "whatsappText" and no audioUrl)
      return templates.filter(
        (t) => t.channel === EContactChannel.WHATSAPP_TEXT && !t.audioUrl,
      );
    } else if (channel === "sms") {
      // SMS text templates (channel === "sms" and no audioUrl)
      return templates.filter((t) => t.channel === "sms" && !t.audioUrl);
    } else if (channel === "ringlessVoice") {
      // Ringless voice templates (channel === "ringlessVoice" and has audioUrl)
      return templates.filter(
        (t) => t.channel === "ringlessVoice" && t.audioUrl,
      );
    }
    return [];
  };

  const channelConfig = [
    {
      key: "leboncoin" as const,
      label: "Leboncoin",
      requiresCredits: false,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Envoie un message via la messagerie Leboncoin",
    },
    {
      key: "whatsapp" as const,
      label: "WhatsApp",
      requiresCredits: true,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      description: "Envoie un message WhatsApp au vendeur (nécessite numéro)",
    },
    {
      key: "sms" as const,
      label: "SMS",
      requiresCredits: true,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Envoie un SMS au vendeur (nécessite numéro)",
    },
    {
      key: "ringlessVoice" as const,
      label: "Message Vocal (Ringless)",
      requiresCredits: true,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      description:
        "Dépose un message vocal dans la boîte vocale (nécessite numéro)",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Paramètres de prise de contact
      </h3>

      <div className="space-y-6">
        {channelConfig.map((config) => {
          const isEnabled = outreachSettings[config.key];
          const availableTemplates = getTemplatesForChannel(config.key);

          return (
            <div
              key={config.key}
              className={`rounded-lg border p-4 transition-colors ${
                isEnabled
                  ? "border-amber-900/50 bg-amber-950/10"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              {/* Channel toggle */}
              <div className="mb-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`channel-${config.key}`}
                  checked={isEnabled}
                  onChange={() => handleToggle(config.key)}
                  className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`channel-${config.key}`}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer"
                  >
                    {config.icon}
                    {config.label}
                  </label>
                  <p className="mt-1 text-xs text-zinc-500">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Template selector */}
              {isEnabled && (
                <div className="mt-3 space-y-3 pl-7">
                  <div>
                    <label
                      htmlFor={`template-${config.key}`}
                      className="mb-2 block text-xs font-medium text-zinc-400"
                    >
                      Template à utiliser
                    </label>
                    {availableTemplates.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-500">
                        Aucun template disponible pour ce canal.{" "}
                        <a
                          href={pages.templates.new()}
                          className="text-amber-500 hover:underline"
                        >
                          Créer un template
                        </a>
                      </div>
                    ) : (
                      <select
                        id={`template-${config.key}`}
                        value={templateIds[config.key] || ""}
                        onChange={(e) =>
                          handleTemplateChange(config.key, e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">Sélectionner un template...</option>
                        {availableTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} (
                            {template.audioUrl ? "Vocal" : "Texte"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Credit allocation input (only for channels that require credits) */}
                  {config.requiresCredits && config.key !== "leboncoin" && (
                    <div>
                      <label
                        htmlFor={`credits-${config.key}`}
                        className="mb-2 block text-xs font-medium text-zinc-400"
                      >
                        Crédits à allouer
                      </label>
                      <input
                        type="number"
                        id={`credits-${config.key}`}
                        min="0"
                        step="1"
                        value={
                          channelCredits?.[
                            config.key as "sms" | "whatsapp" | "ringlessVoice"
                          ] || 0
                        }
                        onChange={(e) =>
                          handleCreditsChange(
                            config.key as "sms" | "whatsapp" | "ringlessVoice",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        1 crédit = 1 contact. Ces crédits seront déduits de
                        votre solde d&apos;organisation.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
