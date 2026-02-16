import { Skeleton } from "@/components/ui/skeleton";

export function AppLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <aside className="w-64 border-r bg-background p-4">
        <div className="space-y-4">
          {/* Logo */}
          <Skeleton className="h-8 w-32" />

          {/* Navigation items */}
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
