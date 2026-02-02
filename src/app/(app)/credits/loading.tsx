import { Skeleton } from "@/components/ui/skeleton";

export default function CreditsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Credit balance cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Hunt allocations table */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Transaction history */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
