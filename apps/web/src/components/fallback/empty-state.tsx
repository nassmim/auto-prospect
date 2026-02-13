import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        {icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 text-lg font-medium text-zinc-200">{title}</h3>

        {/* Description */}
        {description && (
          <p className="mb-4 text-sm text-zinc-400">{description}</p>
        )}

        {/* Action button */}
        {action && (
          <>
            {action.href ? (
              <Link href={action.href}>
                <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={action.onClick}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                {action.label}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
