import { Skeleton } from "@/components/ui/skeleton";
import { LeadCardSkeleton } from "./lead-card-skeleton";

export type TKanbanColumnSkeletonProps = {
  cardCount?: number;
};

/**
 * Skeleton loader for KanbanColumn component
 * Matches the structure: column header with title and count badge, multiple lead cards
 */
export function KanbanColumnSkeleton({
  cardCount = 3,
}: TKanbanColumnSkeletonProps) {
  return (
    <div className="flex min-w-[300px] flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-8 rounded-full" />
      </div>

      {/* Column Content - Lead Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <LeadCardSkeleton count={cardCount} />
      </div>
    </div>
  );
}
