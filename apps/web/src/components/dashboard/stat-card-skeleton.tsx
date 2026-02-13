import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TStatCardSkeletonProps = {
  className?: string;
};

/**
 * Skeleton loader for StatCard component
 * Matches the structure: icon, label, value, optional trend badge
 */
export function StatCardSkeleton({ className = "" }: TStatCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                {/* Label placeholder */}
                <Skeleton className="h-4 w-20" />
                {/* Value placeholder */}
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>

          {/* Trend badge placeholder */}
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
