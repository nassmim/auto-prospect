"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteHunt, updateHuntStatus } from "@/actions/hunt-crud.actions";
import type { HuntStatus } from "@/schema/filter.schema";

type Hunt = {
  id: string;
  name: string;
  status: string;
  autoRefresh: boolean;
  lastScanAt: Date | null;
  createdAt: Date;
  location: {
    name: string;
  };
  brands?: Array<{
    brand: {
      name: string;
    };
  }>;
};

type HuntCardProps = {
  hunt: Hunt;
};

export function HuntCard({ hunt }: HuntCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(hunt.status);
  const router = useRouter();

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      const newStatus: HuntStatus =
        currentStatus === "active" ? "paused" : "active";
      await updateHuntStatus(hunt.id, newStatus);
      setCurrentStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle hunt status:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recherche ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHunt(hunt.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete hunt:", error);
      setIsDeleting(false);
    }
  };

  const isActive = currentStatus === "active";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <Link
            href={`/hunts/${hunt.id}/edit`}
            className="text-lg font-semibold text-zinc-100 hover:text-amber-500"
          >
            {hunt.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-green-500/10 text-green-500"
                  : "bg-zinc-700/50 text-zinc-400"
              }`}
            >
              {isActive ? "Active" : "En pause"}
            </span>
            {hunt.autoRefresh && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                Auto-refresh
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{hunt.location.name}</span>
        </div>

        {hunt.brands && hunt.brands.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-400">
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>{hunt.brands.map((b) => b.brand.name).join(", ")}</span>
          </div>
        )}

        {hunt.lastScanAt && (
          <div className="flex items-center gap-2 text-zinc-400">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Dernière recherche:{" "}
              {new Date(hunt.lastScanAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/hunts/${hunt.id}/edit`}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Modifier
        </Link>
        <button
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            isActive
              ? "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
              : "border-green-900 bg-green-950/30 text-green-500 hover:bg-green-950/50"
          }`}
        >
          {isTogglingStatus
            ? "..."
            : isActive
              ? "Mettre en pause"
              : "Activer"}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-950/50 disabled:opacity-50"
        >
          {isDeleting ? "..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}
