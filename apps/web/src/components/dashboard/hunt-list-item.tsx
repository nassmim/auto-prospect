"use client";

import { pages } from "@/config/routes";
import { THuntSummary } from "@/types/hunt.types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export type THuntListItemProps = {
  hunt: THuntSummary;
  onPauseToggle?: (huntId: string, newStatus: "active" | "paused") => void;
};

/**
 * Hunt list item component for dashboard
 * Shows hunt summary with name, platform, lead counts, and quick actions
 */
export function HuntListItem({ hunt, onPauseToggle }: THuntListItemProps) {
  const isPaused = hunt.status === "paused";

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
      <div className="flex items-center justify-between">
        {/* Hunt Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isPaused ? "bg-zinc-600" : "bg-green-500"
              }`}
              title={isPaused ? "En pause" : "Actif"}
            />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={pages.hunts.detail(hunt.id)}
                  className="text-sm font-medium text-zinc-100 hover:text-amber-500 hover:underline"
                >
                  {hunt.name}
                </Link>
              </div>

              {/* Metrics Row */}
              <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  <span className="font-medium text-zinc-400">
                    {hunt.leadCount}
                  </span>{" "}
                  leads
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>
                  <span className="font-medium text-zinc-400">
                    {hunt.contactedCount}
                  </span>{" "}
                  contactés
                </span>
                {hunt.lastScanAt && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span>
                      Scanné{" "}
                      {formatDistanceToNow(new Date(hunt.lastScanAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Pause/Resume Button */}
          {onPauseToggle && (
            <button
              onClick={() =>
                onPauseToggle(hunt.id, isPaused ? "active" : "paused")
              }
              className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              title={isPaused ? "Reprendre" : "Mettre en pause"}
            >
              {isPaused ? (
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
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
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Edit Link */}
          <Link
            href={pages.hunts.edit(hunt.id)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            title="Modifier"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
