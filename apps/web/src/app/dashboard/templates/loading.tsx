import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCardSkeleton } from "@/components/templates/template-card-skeleton";

export default function TemplatesLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Template cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TemplateCardSkeleton count={6} />
      </div>
    </div>
  );
}
