import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type TStatCardProps = {
  icon: ReactNode;
  label: string;
  value: number | string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
};

/**
 * Stat card component for dashboard metrics
 * Uses shadcn Card and Badge components for consistent styling
 */
export function StatCard({
  icon,
  label,
  value,
  trend,
  className = "",
}: TStatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">
                  {value}
                </p>
              </div>
            </div>
          </div>

          {trend && (
            <Badge
              variant={trend.direction === "up" ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {trend.direction === "up" ? (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              ) : (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              <span>{trend.value}</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
