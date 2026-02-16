"use client";

import { Button } from "@/components/ui/button";
import { pages } from "@/config/routes";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development")
      console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        {/* Error icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-zinc-100">
          Une erreur est survenue
        </h1>

        {/* Error message */}
        <p className="mb-6 text-sm text-zinc-400">
          Une erreur inattendue s&apos;est produite. Essaie de nouveau après
          avoir rechargé la page. Si le problème persiste, contacte-nous.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 cursor-pointer"
          >
            Réessayer
          </Button>
          <Link href={pages.dashboard}>
            <Button
              variant="outline"
              className="w-full border-zinc-800 sm:w-auto cursor-pointer"
            >
              Retour au dashboard
            </Button>
          </Link>
        </div>

        {/* Error digest for debugging */}
        {error.digest && process.env.NODE_ENV === "development" && (
          <p className="mt-6 text-xs text-zinc-600">
            Référence de l&apos;erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
