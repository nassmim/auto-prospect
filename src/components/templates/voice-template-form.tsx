"use client";

import { createVoiceTemplate } from "@/actions/message.actions";
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
import { pages } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AudioRecorder } from "./audio-recorder";

// Form schema without Blob (Blob can't be in react-hook-form)
const voiceTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  isDefault: z.boolean(),
});

type VoiceTemplateFormValues = z.infer<typeof voiceTemplateFormSchema>;

export function VoiceTemplateForm() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<VoiceTemplateFormValues>({
    resolver: zodResolver(voiceTemplateFormSchema),
    defaultValues: {
      name: "",
      isDefault: false,
    },
  });

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);

    // Create preview URL
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create an audio element to get duration
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      const duration = Math.floor(audio.duration);

      if (duration < 15 || duration > 55) {
        setError("Le fichier audio doit durer entre 15 et 55 secondes");
        return;
      }

      setAudioBlob(file);
      setAudioDuration(duration);
      setAudioUrl(url);
      setError(null);
    };

    audio.src = url;
  };

  const handleSubmit = async (data: VoiceTemplateFormValues) => {
    setError(null);

    // Validate audio separately (can't be in form schema)
    if (!audioBlob || !audioDuration) {
      setError("Veuillez enregistrer ou importer un fichier audio");
      return;
    }

    if (audioDuration < 15 || audioDuration > 55) {
      setError("La durée de l'audio doit être entre 15 et 55 secondes");
      return;
    }

    try {
      // Upload audio to Supabase Storage
      const supabase = createClient();
      const fileName = `voice-templates/${Date.now()}-${data.name.replace(/\s+/g, "-")}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("templates")
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("templates").getPublicUrl(uploadData.path);

      // Create template record
      await createVoiceTemplate({
        name: data.name,
        audioUrl: publicUrl,
        audioDuration,
        isDefault: data.isDefault,
      });

      router.push(pages.templates.list);
    } catch (err) {
      console.error("Failed to create voice template:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Name input */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du template</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Message vocal d'introduction"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recording section */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Enregistrer un message vocal
          </h3>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-zinc-500">Ou</span>
          </div>
        </div>

        {/* File upload */}
        <div>
          <label
            htmlFor="audioFile"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Importer un fichier audio
          </label>
          <input
            id="audioFile"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-300 hover:file:bg-zinc-700"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Formats acceptés : MP3, WAV, OGG, WebM (15-55 secondes)
          </p>
        </div>

        {/* Audio preview */}
        {audioUrl && audioDuration && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-300">Aperçu</h4>
              <span className="text-xs text-zinc-500">{audioDuration}s</span>
            </div>
            <audio
              src={audioUrl}
              controls
              className="w-full"
              style={{
                height: "40px",
                filter: "invert(0.9) hue-rotate(180deg)",
              }}
            />
          </div>
        )}

        {/* Is default checkbox */}
        <FormField
          control={form.control}
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
                  Définir comme template vocal par défaut
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
            disabled={
              form.formState.isSubmitting || !audioBlob || !audioDuration
            }
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {form.formState.isSubmitting ? "Création..." : "Créer le template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
