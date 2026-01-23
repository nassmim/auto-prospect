"use client";

import { bulkUpdateLeads } from "@/actions/lead.actions";
import { leadStages, type LeadStage } from "@/schema/lead.schema";
import { useState, useTransition } from "react";

type Lead = {
  id: string;
  stage: string;
  assignedToId: string | null;
  createdAt: Date;
  ad: {
    title: string;
    price: number | null;
    phoneNumber: string | null;
    zipcode: {
      name: string;
    };
  };
  assignedTo: {
    name: string;
  } | null;
};

type ListViewProps = {
  initialLeads: Lead[];
  onLeadClick?: (leadId: string) => void;
};

type SortField = "title" | "price" | "stage" | "assignedTo" | "createdAt";
type SortDirection = "asc" | "desc";

const STAGE_LABELS: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relance",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

export function ListView({ initialLeads, onLeadClick }: ListViewProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isPending, startTransition] = useTransition();

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((lead) => lead.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleBulkStageUpdate = async (newStage: LeadStage) => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      try {
        await bulkUpdateLeads(Array.from(selectedIds), { stage: newStage });
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Failed to bulk update leads:", error);
      }
    });
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: number | string | Date | undefined;
    let bVal: number | string | Date | undefined;

    switch (sortField) {
      case "title":
        aVal = a.ad.title;
        bVal = b.ad.title;
        break;
      case "price":
        aVal = a.ad.price || 0;
        bVal = b.ad.price || 0;
        break;
      case "stage":
        aVal = a.stage;
        bVal = b.stage;
        break;
      case "assignedTo":
        aVal = a.assignedTo?.name || "";
        bVal = b.assignedTo?.name || "";
        break;
      case "createdAt":
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
          <span className="text-sm text-zinc-100">
            {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} sélectionné
            {selectedIds.size > 1 ? "s" : ""}
          </span>

          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100"
            onChange={(e) => handleBulkStageUpdate(e.target.value as LeadStage)}
            defaultValue=""
          >
            <option value="" disabled>
              Changer le stage...
            </option>
            {leadStages.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-zinc-400 hover:text-zinc-100"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900">
            <tr>
              <th className="w-12 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
              </th>
              <SortableHeader
                field="title"
                label="Véhicule"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                field="price"
                label="Prix"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="p-3 text-left text-sm font-medium text-zinc-400">
                Localisation
              </th>
              <SortableHeader
                field="stage"
                label="Stage"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                field="assignedTo"
                label="Assigné à"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                field="createdAt"
                label="Date"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                  />
                </td>
                <td
                  className="cursor-pointer p-3 text-sm text-zinc-100"
                  onClick={() => onLeadClick?.(lead.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1">{lead.ad.title}</span>
                    {lead.ad.phoneNumber && (
                      <svg
                        className="h-3 w-3 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm font-semibold text-amber-500">
                  {lead.ad.price
                    ? `${lead.ad.price.toLocaleString("fr-FR")} €`
                    : "-"}
                </td>
                <td className="p-3 text-sm text-zinc-400">
                  {lead.ad.zipcode.name}
                </td>
                <td className="p-3">
                  <span className="inline-block rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                    {STAGE_LABELS[lead.stage as LeadStage]}
                  </span>
                </td>
                <td className="p-3 text-sm text-zinc-400">
                  {lead.assignedTo?.name || "Non assigné"}
                </td>
                <td className="p-3 text-sm text-zinc-400">
                  {new Date(lead.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedLeads.length === 0 && (
          <div className="py-12 text-center text-zinc-600">
            Aucun lead trouvé
          </div>
        )}
      </div>

      {/* Pagination placeholder */}
      {sortedLeads.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            {sortedLeads.length} lead{sortedLeads.length > 1 ? "s" : ""}
          </span>
          {/* TODO: Add pagination controls */}
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;

  return (
    <th
      className="cursor-pointer p-3 text-left text-sm font-medium text-zinc-400 hover:text-zinc-100"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {isActive && (
          <svg
            className={`h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        )}
      </div>
    </th>
  );
}
