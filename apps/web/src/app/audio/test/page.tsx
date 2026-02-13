"use client";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";

export default function AudioRecorderTestPage() {
  const {
    isRecording,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">
          Test Enregistrement Audio
        </h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Recording controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
              >
                <span className="h-3 w-3 rounded-full bg-white"></span>
                Enregistrer
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                <span className="h-3 w-3 bg-white"></span>
                Stop
              </button>
            )}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
              Enregistrement en cours...
            </div>
          )}

          {/* Audio playback */}
          {audioUrl && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Lecture :</p>
                <button
                  onClick={resetRecording}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Supprimer
                </button>
              </div>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
