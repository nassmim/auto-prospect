"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { LeadCard } from "./lead-card";
import { KanbanColumn } from "./kanban-column";
import { leadStages, type LeadStage } from "@/schema/lead.schema";
import { updateLeadStage } from "@/actions/lead.actions";

type Lead = {
  id: string;
  stage: string;
  position: number;
  ad: {
    title: string;
    price: number | null;
    picture: string | null;
    phoneNumber: string | null;
    isWhatsappPhone: boolean | null;
    zipcode: {
      name: string;
    };
  };
};

type KanbanViewProps = {
  initialLeads: Lead[];
  onLeadClick?: (leadId: string) => void;
};

const STAGE_LABELS: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relance",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

export function KanbanView({ initialLeads, onLeadClick }: KanbanViewProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = active.id as string;
    const newStage = over.id as LeadStage;

    // Optimistic update
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStage } : lead,
      ),
    );

    // Server update
    startTransition(async () => {
      try {
        await updateLeadStage(leadId, newStage);
      } catch (error) {
        console.error("Failed to update lead stage:", error);
        // Revert optimistic update on error
        setLeads(initialLeads);
      }
    });

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeLeadItem = activeId
    ? leads.find((lead) => lead.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {leadStages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage);

          return (
            <KanbanColumn
              key={stage}
              id={stage}
              title={STAGE_LABELS[stage]}
              count={stageLeads.length}
            >
              <SortableContext items={stageLeads.map((lead) => lead.id)}>
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => onLeadClick?.(lead.id)}
                      isDragging={lead.id === activeId}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="py-8 text-center text-sm text-zinc-600">
                      Aucun lead
                    </p>
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeLeadItem ? (
          <LeadCard lead={activeLeadItem} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
