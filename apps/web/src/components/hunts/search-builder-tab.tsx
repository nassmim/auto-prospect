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
