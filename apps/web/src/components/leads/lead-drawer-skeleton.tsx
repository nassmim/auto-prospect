import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for LeadDrawer component content
 * Matches the structure: image gallery, title/price, action buttons, specs grid, seller info, notes/reminders
 */
export function LeadDrawerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Image Gallery */}
      <section className="space-y-3">
        {/* Main Image */}
        <Skeleton className="aspect-video w-full rounded-xl" />

        {/* Thumbnails */}
        <div className="flex gap-2">
          <Skeleton className="h-16 w-24 flex-shrink-0 rounded-lg" />
          <Skeleton className="h-16 w-24 flex-shrink-0 rounded-lg" />
          <Skeleton className="h-16 w-24 flex-shrink-0 rounded-lg" />
        </div>
      </section>

      {/* Title and Basic Info */}
      <section className="space-y-3">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-3/4" />

        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
      </section>

      {/* Stage and Assignment Selectors */}
      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </section>

      {/* Vehicle Specs Grid */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </section>

      {/* Seller Info */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </section>

      {/* Notes Section */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </section>

      {/* Reminders Section */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </section>

      {/* View Full Details Button */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
