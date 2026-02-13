import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

type DataNotFoundProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href: string;
  };
};

export function DataNotFound({
  title = "Données introuvables",
  description = "Les données demandées n'existent pas ou ne sont plus disponibles.",
  icon,
  action,
}: DataNotFoundProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
          {icon || (
            <svg
              className="h-8 w-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className="mb-3 text-xl font-semibold text-zinc-100">{title}</h2>

        {/* Description */}
        <p className="mb-6 text-sm text-zinc-400">{description}</p>

        {/* Action button */}
        {action && (
          <Link href={action.href}>
            <Button
              variant="outline"
              className="border-zinc-800 hover:bg-zinc-800"
            >
              {action.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
