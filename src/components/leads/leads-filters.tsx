"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function LeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  const updateFilter = (name: string, value: string) => {
    const queryString = createQueryString(name, value);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Hunt Filter */}
      <select
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        value={searchParams.get("hunt") || ""}
        onChange={(e) => updateFilter("hunt", e.target.value)}
      >
        <option value="">Toutes les recherches</option>
        {/* TODO: Populate from hunts data */}
      </select>

      {/* Assigned User Filter */}
      <select
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        value={searchParams.get("assigned") || ""}
        onChange={(e) => updateFilter("assigned", e.target.value)}
      >
        <option value="">Tous les utilisateurs</option>
        <option value="me">Mes leads</option>
        <option value="unassigned">Non assignés</option>
        {/* TODO: Populate from org members data */}
      </select>

      {/* Search Input */}
      <input
        type="search"
        placeholder="Rechercher..."
        className="min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        value={searchParams.get("q") || ""}
        onChange={(e) => updateFilter("q", e.target.value)}
      />

      {/* Clear Filters */}
      {(searchParams.get("hunt") ||
        searchParams.get("assigned") ||
        searchParams.get("q")) && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
