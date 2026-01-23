"use client";

import { useEffect, useState } from "react";
import { getOrganizationTemplates } from "@/actions/template.actions";
import { pages } from "@/config/routes";

type OutreachSettingsProps = {
  outreachSettings: {
    leboncoin?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
  };
  templateIds: {
    leboncoin?: string | null;
    whatsapp?: string | null;
    sms?: string | null;
  };
  onOutreachChange: (settings: OutreachSettingsProps["outreachSettings"]) => void;
  onTemplateChange: (templateIds: OutreachSettingsProps["templateIds"]) => void;
};

type Template = {
  id: string;
  name: string;
  type: "text" | "voice";
  channel?: "whatsapp" | "sms" | "leboncoin" | null;
};

export function OutreachSettings({
  outreachSettings,
  templateIds,
  onOutreachChange,
  onTemplateChange,
}: OutreachSettingsProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch templates on mount
    getOrganizationTemplates()
      .then((data) => {
        setTemplates(data as Template[]);
      })
      .catch((error) => {
        console.error("Failed to fetch templates:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleToggle = (channel: "leboncoin" | "whatsapp" | "sms") => {
    onOutreachChange({
      ...outreachSettings,
      [channel]: !outreachSettings[channel],
    });
  };

  const handleTemplateChange = (
    channel: "leboncoin" | "whatsapp" | "sms",
    templateId: string,
  ) => {
    onTemplateChange({
      ...templateIds,
      [channel]: templateId || null,
    });
  };

  // Filter templates by channel and type
  const getTemplatesForChannel = (
    channel: "leboncoin" | "whatsapp" | "sms",
  ) => {
    if (channel === "leboncoin") {
      // Leboncoin uses text templates with leboncoin channel
      return templates.filter(
        (t) => t.type === "text" && t.channel === "leboncoin",
      );
    } else if (channel === "whatsapp") {
      // WhatsApp can use text templates with whatsapp channel
      return templates.filter(
        (t) => t.type === "text" && t.channel === "whatsapp",
      );
    } else if (channel === "sms") {
      // SMS can use both text and voice templates with sms channel
      return templates.filter(
        (t) => (t.type === "text" || t.type === "voice") && t.channel === "sms",
      );
    }
    return [];
  };

  const channelConfig = [
    {
      key: "leboncoin" as const,
      label: "Leboncoin",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Envoie un SMS au vendeur (nécessite numéro, consomme des crédits)",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Paramètres de prise de contact
      </h3>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          Chargement des templates...
        </div>
      ) : (
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
                  <div className="mt-3 pl-7">
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
                          href={pages.templates_new}
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
                            {template.name} ({template.type === "text" ? "Texte" : "Vocal"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
