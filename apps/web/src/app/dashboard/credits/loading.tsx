import { Skeleton } from "@/components/ui/skeleton";
import { CreditsCardSkeleton } from "@/components/credits/credits-card-skeleton";
import { CreditsTableSkeleton } from "@/components/credits/credits-table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CreditsCardSkeleton count={4} />
      </div>

      {/* Hunt allocations table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreditsTableSkeleton variant="allocations" rowCount={5} />
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-56" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreditsTableSkeleton variant="transactions" rowCount={8} />
        </CardContent>
      </Card>
    </div>
  );
}
