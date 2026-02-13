import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TLeadCardSkeletonProps = {
  count?: number;
};

/**
 * Skeleton loader for LeadCard component
 * Matches the structure: image thumbnail, title, price and location, badges
 */
export function LeadCardSkeleton({ count = 1 }: TLeadCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="group cursor-pointer transition-all">
          <CardContent className="p-3">
            {/* Thumbnail placeholder */}
            <Skeleton className="mb-3 aspect-video w-full rounded-md" />

            {/* Title placeholder */}
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-3/4" />

            {/* Price and Location row */}
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Badges row */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="ml-auto h-6 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
