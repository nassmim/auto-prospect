"use client";

import { useState } from "react";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { KanbanView } from "@/components/leads/kanban-view";

type ViewMode = "kanban" | "list";

type Lead = Awaited<
  ReturnType<typeof import("@/services/lead.service").getPipelineLeads>
>[number];

interface LeadsPageClientProps {
  leads: Lead[];
}

export function LeadsPageClient({ leads }: LeadsPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-100">
            Pipeline de leads
          </h1>

          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Liste
            </button>
          </div>
        </div>

        {/* Filters */}
        <LeadsFilters />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-4">
        {viewMode === "kanban" ? (
          <KanbanView initialLeads={leads} />
        ) : (
          <div className="h-full">
            {/* TODO: Implement ListView component */}
            <p className="text-center text-zinc-400">
              List view coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
