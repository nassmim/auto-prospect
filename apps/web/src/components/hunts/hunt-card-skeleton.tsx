import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type THuntCardSkeletonProps = {
  count?: number;
};

/**
 * Skeleton loader for HuntCard component
 * Matches the structure: header with title and badges, content with location/brands/dates, footer with action buttons
 */
export function HuntCardSkeleton({ count = 1 }: THuntCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Hunt title */}
                <Skeleton className="h-6 w-48" />

                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>

              {/* Brands */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>

              {/* Last scan date */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-48" />
              </div>

              {/* Daily limit */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
