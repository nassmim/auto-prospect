import { Skeleton } from "@/components/ui/skeleton";

export default function EditHuntLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <Skeleton className="h-5 w-64" />

        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
