"use client";

import {
  deleteHunt,
  fetchAccountHunts,
  updateHuntStatus,
} from "@/actions/hunt.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pages } from "@/config/routes";
import {
  EHuntStatus,
  THuntStatus,
} from "@auto-prospect/shared/src/config/hunt.config";
import Link from "next/link";
import { useState } from "react";
import type { KeyedMutator } from "swr";

type Hunt = {
  id: string;
  name: string;
  status: string;
  autoRefresh: boolean;
  lastScanAt: Date | null;
  createdAt: Date;
  dailyPacingLimit?: number | null;
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
  onMutate: KeyedMutator<Awaited<ReturnType<typeof fetchAccountHunts>>>;
};

export function HuntCard({ hunt, onMutate }: HuntCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(hunt.status);

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    const newStatus: THuntStatus =
      currentStatus === EHuntStatus.ACTIVE
        ? EHuntStatus.PAUSED
        : EHuntStatus.ACTIVE;

    // Optimistic update
    setCurrentStatus(newStatus);
    await onMutate(
      (currentData) =>
        currentData?.map((h) =>
          h.id === hunt.id ? { ...h, status: newStatus } : h,
        ),
      { revalidate: false },
    );

    try {
      await updateHuntStatus(hunt.id, newStatus);
      // Revalidate after success
      await onMutate();
    } catch (error) {
      console.error("Failed to toggle hunt status:", error);
      // Rollback on error
      setCurrentStatus(hunt.status);
      await onMutate();
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette recherche ?")) {
      return;
    }

    setIsDeleting(true);

    // Optimistic deletion - remove from list
    await onMutate(
      (currentData) => currentData?.filter((h) => h.id !== hunt.id),
      { revalidate: false },
    );

    try {
      await deleteHunt(hunt.id);
      // Revalidate after success
      await onMutate();
    } catch (error) {
      console.error("Failed to delete hunt:", error);
      // Rollback on error
      await onMutate();
      setIsDeleting(false);
    }
  };

  const isActive = currentStatus === "active";

  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link
              href={pages.hunts.edit(hunt.id)}
              className="hover:text-amber-500"
            >
              <CardTitle>{hunt.name}</CardTitle>
            </Link>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "En pause"}
              </Badge>
              {hunt.autoRefresh && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                >
                  Auto-refresh
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
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

          {hunt.dailyPacingLimit && (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Limite quotidienne: {hunt.dailyPacingLimit} contacts/jour
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={pages.hunts.edit(hunt.id)}>Modifier</Link>
        </Button>
        <Button
          variant={isActive ? "outline" : "default"}
          size="sm"
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className="flex-1"
        >
          {isTogglingStatus ? "..." : isActive ? "Mettre en pause" : "Activer"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "..." : "Supprimer"}
        </Button>
      </CardFooter>
    </Card>
  );
}
