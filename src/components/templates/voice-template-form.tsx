"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVoiceTemplate } from "@/actions/template.actions";
import { AudioRecorder } from "./audio-recorder";
import { createClient } from "@/lib/supabase/client";

export function VoiceTemplateForm() {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }

    if (!audioBlob || !audioDuration) {
      setError("Veuillez enregistrer ou importer un fichier audio");
      return;
    }

    setIsSaving(true);

    try {
      // Upload audio to Supabase Storage
      const supabase = createClient();
      const fileName = `voice-templates/${Date.now()}-${name.replace(/\s+/g, "-")}.webm`;

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
        name,
        audioUrl: publicUrl,
        audioDuration,
        isDefault,
      });

      router.push("/templates");
    } catch (err) {
      console.error("Failed to create voice template:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Name input */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Nom du template
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Message vocal d'introduction"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

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
      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
        />
        <label htmlFor="isDefault" className="text-sm text-zinc-300">
          Définir comme template vocal par défaut
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
          disabled={isSaving || !name.trim() || !audioBlob || !audioDuration}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Création..." : "Créer le template"}
        </button>
      </div>
    </form>
  );
}
