"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTextTemplate } from "@/actions/template.actions";
import { VariableToolbar } from "./variable-toolbar";
import { renderTemplate } from "@/services/message.service";
import type { MessageChannel } from "@/schema/message-template.schema";

export function TextTemplateForm() {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + variable + content.substring(end);

    setContent(newContent);

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length,
      );
    }, 0);
  };

  const handleSuggestWithAI = () => {
    // Stub for Phase 2
    alert("Cette fonctionnalité sera bientôt disponible !");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !content.trim()) {
      setError("Le nom et le contenu sont requis");
      return;
    }

    setIsSaving(true);

    try {
      await createTextTemplate({
        name,
        channel,
        content,
        isDefault,
      });

      router.push("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
      setIsSaving(false);
    }
  };

  // Sample data for preview
  const previewData = {
    titre_annonce: "Peugeot 308 GTI 270ch",
    prix: "18 500 €",
    marque: "Peugeot",
    modele: "308",
    annee: "2018",
    ville: "Paris",
    vendeur_nom: "Jean Dupont",
  };

  const previewContent = renderTemplate(content, previewData);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Name input */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
          Nom du template
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Premier contact WhatsApp"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* Channel select */}
      <div>
        <label htmlFor="channel" className="mb-2 block text-sm font-medium text-zinc-300">
          Canal
        </label>
        <select
          id="channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as MessageChannel)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="leboncoin">Leboncoin</option>
        </select>
      </div>

      {/* Variable toolbar */}
      <VariableToolbar onInsertVariable={handleInsertVariable} />

      {/* Content textarea */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="content" className="text-sm font-medium text-zinc-300">
            Contenu du message
          </label>
          <button
            type="button"
            onClick={handleSuggestWithAI}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Suggérer par IA
          </button>
        </div>
        <textarea
          id="content"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bonjour, je suis intéressé par votre {titre_annonce}..."
          rows={6}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* Live preview */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-300">
          Aperçu (avec données d'exemple)
        </h3>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="whitespace-pre-wrap text-sm text-zinc-300">
            {previewContent || "Votre message apparaîtra ici..."}
          </p>
        </div>
      </div>

      {/* Is default checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
        />
        <label htmlFor="isDefault" className="text-sm text-zinc-300">
          Définir comme template par défaut pour {channel}
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving || !name.trim() || !content.trim()}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Création..." : "Créer le template"}
        </button>
      </div>
    </form>
  );
}
