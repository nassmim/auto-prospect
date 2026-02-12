import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TTemplateCardSkeletonProps = {
  count?: number;
};

/**
 * Skeleton loader for TemplateCard component
 * Matches the structure: header with icon and badges, title, channel badge, content preview, footer
 */
export function TemplateCardSkeleton({
  count = 1,
}: TTemplateCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="group relative overflow-hidden transition-all"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>

            <Skeleton className="mt-3 h-6 w-3/4" />
          </CardHeader>

          <CardContent className="pb-3">
            {/* Channel badge */}
            <Skeleton className="mb-2 h-6 w-20 rounded-full" />

            {/* Content preview lines */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>

          <CardFooter className="border-t pt-3">
            <Skeleton className="h-3 w-32" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
