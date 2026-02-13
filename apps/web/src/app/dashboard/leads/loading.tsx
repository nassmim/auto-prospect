import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumnSkeleton } from "@/components/leads/kanban-column-skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumnSkeleton cardCount={3} />
        <KanbanColumnSkeleton cardCount={3} />
        <KanbanColumnSkeleton cardCount={3} />
        <KanbanColumnSkeleton cardCount={3} />
      </div>
    </div>
  );
}
