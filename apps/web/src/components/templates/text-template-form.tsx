"use client";

import { createTextTemplate } from "@/actions/message.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTACT_CHANNEL_DEFINITIONS,
  EContactChannel,
} from "@/config/message.config";
import { pages } from "@/config/routes";
import { renderMessageTemplate } from "@/utils/message.utils";
import {
  textTemplateSchema,
  type TTextTemplateFormData,
} from "@/validation-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { VariableToolbar } from "./variable-toolbar";

interface TextTemplateFormProps {
  defaultChannel?: string;
}

export function TextTemplateForm({ defaultChannel }: TextTemplateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Get text channels only (SMS and WhatsApp)
  const textChannels = CONTACT_CHANNEL_DEFINITIONS.filter(
    (ch) =>
      ch.value === EContactChannel.SMS ||
      ch.value === EContactChannel.WHATSAPP_TEXT,
  );

  const form = useForm<TTextTemplateFormData>({
    resolver: zodResolver(textTemplateSchema),
    defaultValues: {
      name: "",
      channel:
        (defaultChannel as TTextTemplateFormData["channel"]) ||
        EContactChannel.WHATSAPP_TEXT,
      content: "",
      isDefault: false,
    },
  });

  const {
    control,
    setValue,
    getValues,
    watch,
    formState: { isSubmitting },
    handleSubmit,
  } = form;

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = getValues("content");
    const newContent =
      currentContent.substring(0, start) +
      variable +
      currentContent.substring(end);

    setValue("content", newContent, { shouldValidate: true });

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

  const onSubmit = async (data: TTextTemplateFormData) => {
    setError(null);

    try {
      await createTextTemplate({
        name: data.name,
        channel: data.channel,
        content: data.content,
        isDefault: data.isDefault,
      });

      router.push(pages.templates.list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
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

  const contentValue = watch("content");
  const channelValue = watch("channel");
  const previewContent = renderMessageTemplate(contentValue, previewData);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Name input */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du template</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Premier contact WhatsApp"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Channel select */}
        <FormField
          control={control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
                    <SelectValue placeholder="Sélectionner un canal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {textChannels.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variable toolbar */}
        <VariableToolbar onInsertVariable={handleInsertVariable} />

        {/* Content textarea */}
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <div className="mb-2 flex items-center justify-between">
                <FormLabel>Contenu du message</FormLabel>
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
              <FormControl>
                <textarea
                  {...field}
                  ref={textareaRef}
                  placeholder="Bonjour, je suis intéressé par votre {titre_annonce}..."
                  rows={6}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Live preview */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-300">
            Aperçu (avec données d&aposexemple)
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-300">
              {previewContent || "Votre message apparaîtra ici..."}
            </p>
          </div>
        </div>

        {/* Is default checkbox */}
        <FormField
          control={control}
          name="isDefault"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                  />
                </FormControl>
                <FormLabel className="text-sm text-zinc-300 cursor-pointer">
                  Définir comme template par défaut pour{" "}
                  {textChannels.find((ch) => ch.value === channelValue)
                    ?.label || channelValue}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer le template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
