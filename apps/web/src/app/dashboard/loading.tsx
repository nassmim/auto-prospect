import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/dashboard/stat-card-skeleton";
import { HuntListItemSkeleton } from "@/components/dashboard/hunt-list-item-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Active hunts section */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-3">
          <HuntListItemSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}
