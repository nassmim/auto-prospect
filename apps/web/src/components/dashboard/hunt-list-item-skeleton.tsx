import { Skeleton } from "@/components/ui/skeleton";

export type THuntListItemSkeletonProps = {
  count?: number;
};

/**
 * Skeleton loader for HuntListItem component
 * Matches the structure: status indicator, hunt name, metrics row, action buttons
 */
export function HuntListItemSkeleton({
  count = 1,
}: THuntListItemSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
        >
          <div className="flex items-center justify-between">
            {/* Hunt Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <Skeleton className="h-2.5 w-2.5 rounded-full" />

                <div className="flex-1 space-y-2">
                  {/* Hunt name */}
                  <Skeleton className="h-4 w-48" />

                  {/* Metrics Row */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-1 w-1 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-1 w-1 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
