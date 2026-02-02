"use client";

import { useState, useTransition, useRef } from "react";
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
import { LeadDrawer } from "./lead-drawer";
import { KanbanColumn } from "./kanban-column";
import { leadStages, type LeadStage } from "@/schema/lead.schema";
import { updateLeadStage, fetchPipelineLeads } from "@/actions/lead.actions";
import { swrKeys } from "@/config/swr-keys";
import { SWR_POLLING } from "@/hooks/use-swr-action";
import useSWR from "swr";

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
};

const STAGE_LABELS: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relance",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

export function KanbanView({ initialLeads }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDraggingRef = useRef(false);

  // Fetch pipeline leads with SWR polling
  // Pause polling during drag operations to avoid UI jumps
  const { data: leads = initialLeads, mutate } = useSWR(
    swrKeys.leads.pipeline,
    () => fetchPipelineLeads(),
    {
      fallbackData: initialLeads,
      refreshInterval: isDraggingRef.current ? 0 : SWR_POLLING.KANBAN,
      revalidateOnFocus: true,
    },
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = active.id as string;
    const newStage = over.id as LeadStage;

    // Optimistic update with SWR
    const optimisticLeads = leads.map((lead) =>
      lead.id === leadId ? { ...lead, stage: newStage } : lead,
    );

    mutate(optimisticLeads, {
      revalidate: false,
      optimisticData: optimisticLeads,
    });

    // Server update
    startTransition(async () => {
      try {
        await updateLeadStage(leadId, newStage);
        // Revalidate to get server truth
        mutate();
      } catch (error) {
        console.error("Failed to update lead stage:", error);
        // Rollback on error
        mutate();
      }
    });

    setActiveId(null);
  };

  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveId(null);
  };

  const activeLeadItem = activeId
    ? leads.find((lead) => lead.id === activeId)
    : null;

  return (
    <>
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
                        onClick={() => setSelectedLeadId(lead.id)}
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

      {/* Lead Drawer */}
      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </>
  );
}
