"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadFiltersSchema } from "@/validation-schemas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

  const updateFilter = (name: keyof typeof leadFiltersSchema.shape, value: string) => {
    const validated = leadFiltersSchema.partial().safeParse({ [name]: value });

    if (!validated.success) {
      console.error("Filter validation failed:", validated.error);
      return;
    }

    const queryString = createQueryString(name, value);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Hunt Filter */}
      <Select
        value={searchParams.get("hunt") || undefined}
        onValueChange={(value) => updateFilter("hunt", value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Toutes les recherches" />
        </SelectTrigger>
        <SelectContent>
          {/* TODO: Populate from hunts data */}
        </SelectContent>
      </Select>

      {/* Assigned User Filter */}
      <Select
        value={searchParams.get("assigned") || undefined}
        onValueChange={(value) => updateFilter("assigned", value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tous les utilisateurs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="me">Mes leads</SelectItem>
          <SelectItem value="unassigned">Non assignés</SelectItem>
          {/* TODO: Populate from org members data */}
        </SelectContent>
      </Select>

      {/* Search Input */}
      <Input
        type="search"
        placeholder="Rechercher..."
        className="min-w-[200px]"
        value={searchParams.get("q") || ""}
        onChange={(e) => updateFilter("q", e.target.value)}
      />

      {/* Clear Filters */}
      {(searchParams.get("hunt") ||
        searchParams.get("assigned") ||
        searchParams.get("q")) && (
        <Button
          variant="outline"
          onClick={() => router.push(pathname)}
        >
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
