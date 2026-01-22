import { ReactNode } from "react";

export type StatCardProps = {
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
 * Displays a metric with icon, value, label, and optional trend indicator
 */
export function StatCard({
  icon,
  label,
  value,
  trend,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 ${className}`}
    >
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
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.direction === "up"
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {trend.direction === "up" ? (
              <svg
                className="h-4 w-4"
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
                className="h-4 w-4"
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
          </div>
        )}
      </div>
    </div>
  );
}
