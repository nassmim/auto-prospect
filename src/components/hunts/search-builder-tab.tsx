type SearchBuilderTabProps = {
  value: {
    platform: string;
    priceMin: number;
    priceMax: number | null;
    mileageMin: number;
    mileageMax: number | null;
    brands: string[];
    location: string;
    radius: number;
  };
  onChange: (value: SearchBuilderTabProps["value"]) => void;
};

export function SearchBuilderTab({ value, onChange }: SearchBuilderTabProps) {
  return (
    <div className="space-y-6">
      {/* Phase 2 Placeholder */}
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            className="h-6 w-6 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-sm font-semibold text-amber-500">
          Fonctionnalité à venir
        </h3>
        <p className="text-xs text-zinc-400">
          Le constructeur de recherche visuel sera disponible dans une prochaine version.
          En attendant, utilisez l'onglet "Coller une URL" pour créer vos recherches.
        </p>
      </div>

      {/* Preview of what will be available */}
      <div className="space-y-4 opacity-50 pointer-events-none">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Plateforme
            </label>
            <select
              disabled
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200"
            >
              <option>Leboncoin</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Localisation
            </label>
            <input
              type="text"
              disabled
              placeholder="Ex: Paris"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Prix minimum
            </label>
            <input
              type="number"
              disabled
              placeholder="0"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Prix maximum
            </label>
            <input
              type="number"
              disabled
              placeholder="Illimité"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Marques
          </label>
          <input
            type="text"
            disabled
            placeholder="Sélectionner des marques..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200"
          />
        </div>
      </div>
    </div>
  );
}
