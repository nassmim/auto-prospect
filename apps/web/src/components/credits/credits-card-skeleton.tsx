import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TCreditsCardSkeletonProps = {
  count?: number;
};

/**
 * Skeleton loader for credit balance cards
 * Matches the structure: header with label, large value display
 */
export function CreditsCardSkeleton({ count = 4 }: TCreditsCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
