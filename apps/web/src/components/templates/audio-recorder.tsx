"use client";

import { useRef, useState } from "react";

// Helper to get current timestamp (wrapped to avoid React purity checks)
const getCurrentTime = () => Date.now();

type AudioRecorderProps = {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
};

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const finalDuration = Math.floor(duration);

        // Validate duration (15-55 seconds)
        if (finalDuration < 15) {
          setError("L'enregistrement doit durer au moins 15 secondes");
        } else if (finalDuration > 55) {
          setError("L'enregistrement ne peut pas dépasser 55 secondes");
        } else {
          onRecordingComplete(audioBlob, finalDuration);
          setError(null);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Capture start time before starting recording
      const recordingStartTime = getCurrentTime();

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      startTimeRef.current = recordingStartTime;

      // Update duration every 100ms
      timerRef.current = setInterval(() => {
        const elapsed = (getCurrentTime() - recordingStartTime) / 1000;
        setDuration(elapsed);

        // Auto-stop at 55 seconds
        if (elapsed >= 55) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        {/* Duration display */}
        <div className="mb-4 text-center">
          <div
            className={`text-4xl font-bold tabular-nums ${
              duration >= 55
                ? "text-red-400"
                : duration >= 15
                  ? "text-green-400"
                  : "text-amber-500"
            }`}
          >
            {formatDuration(duration)}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {duration < 15
              ? `Minimum ${formatDuration(15 - duration)} restant`
              : duration <= 55
                ? "Durée valide"
                : "Durée maximale atteinte"}
          </p>
        </div>

        {/* Record button */}
        <div className="flex justify-center">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-4 border-red-500 bg-red-500/20 text-red-500 transition-all hover:bg-red-500/30"
            >
              <svg
                className="h-10 w-10"
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
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-4 border-red-500 bg-red-500 text-white transition-all hover:bg-red-600"
            >
              <div className="h-6 w-6 rounded bg-white" />
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-zinc-400">
          {!isRecording ? (
            <p>Cliquez pour commencer l&aposenregistrement</p>
          ) : (
            <p className="animate-pulse font-medium text-red-400">
              Enregistrement en cours...
            </p>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-zinc-300">Exigences</h4>
        <ul className="space-y-1 text-xs text-zinc-500">
          <li className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 ${duration >= 15 ? "text-green-500" : "text-zinc-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Durée minimale : 15 secondes
          </li>
          <li className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 ${duration <= 55 ? "text-green-500" : "text-red-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Durée maximale : 55 secondes
          </li>
        </ul>
      </div>
    </div>
  );
}
