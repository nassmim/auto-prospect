"use client";

import { fetchPipelineLeads, updateLeadStage } from "@/actions/lead.actions";
import { LEAD_STAGE_DEFINITIONS, TLeadStage } from "@/config/lead.config";
import { swrKeys } from "@/config/swr-keys";
import { SWR_POLLING } from "@/hooks/use-swr-action";
import { TPipelineLead } from "@/services/lead.service";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useState, useTransition } from "react";
import useSWR from "swr";
import { KanbanColumn } from "./kanban-column";
import { LeadCard } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";

type KanbanViewProps = {
  initialLeads: TPipelineLead[];
};

export function KanbanView({ initialLeads }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  // Fetch pipeline leads with SWR polling
  // Pause polling during drag operations to avoid UI jumps
  const { data: leads = initialLeads, mutate } = useSWR(
    swrKeys.leads.pipeline,
    () => fetchPipelineLeads(),
    {
      fallbackData: initialLeads,
      refreshInterval: isDragging ? 0 : SWR_POLLING.KANBAN,
      revalidateOnFocus: true,
    },
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = active.id as string;
    const newStage = over.id as TLeadStage;

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
    setIsDragging(false);
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
          {LEAD_STAGE_DEFINITIONS.map((stageConfig) => {
            const stageLeads = leads.filter(
              (lead) => lead.stage === stageConfig.value,
            );

            return (
              <KanbanColumn
                key={stageConfig.value}
                id={stageConfig.value}
                title={stageConfig.label}
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
