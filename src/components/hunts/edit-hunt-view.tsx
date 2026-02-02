import Link from "next/link";
import { HuntForm } from "@/components/hunts/hunt-form";
import { pages } from "@/config/routes";
import { getHuntById } from "@/services/hunt.service";

type EditHuntViewProps = {
  hunt: Awaited<ReturnType<typeof getHuntById>>;
};

export function EditHuntView({ hunt }: EditHuntViewProps) {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href={pages.hunts.list}
            className="text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Recherches
          </Link>
          <svg
            className="h-4 w-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-400 truncate max-w-[200px]">{hunt.name}</span>
          <svg
            className="h-4 w-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-100">Modifier</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-zinc-100">
            Modifier la recherche
          </h1>
          <p className="text-sm text-zinc-400">
            Modifiez les paramètres de votre recherche
          </p>
        </div>

        {/* Form */}
        <HuntForm
          hunt={{
            id: hunt.id,
            name: hunt.name,
            locationId: hunt.locationId,
            radiusInKm: hunt.radiusInKm,
            adTypeId: hunt.typeId,
            autoRefresh: hunt.autoRefresh,
            dailyPacingLimit: hunt.dailyPacingLimit,
            outreachSettings: hunt.outreachSettings ?? undefined,
            templateIds: hunt.templateIds ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
