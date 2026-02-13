import { LeadDrawerSkeleton } from "@/components/leads/lead-drawer-skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <LeadDrawerSkeleton />
    </div>
  );
}
