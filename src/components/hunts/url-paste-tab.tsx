type UrlPasteTabProps = {
  value: string;
  onChange: (value: string) => void;
};

export function UrlPasteTab({ value, onChange }: UrlPasteTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="searchUrl"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          URL de recherche Leboncoin
        </label>
        <input
          id="searchUrl"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.leboncoin.fr/recherche?category=2&..."
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Effectuez votre recherche sur Leboncoin, puis copiez l&apos;URL
          complète ici
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <h4 className="mb-2 text-sm font-semibold text-zinc-300">
          Comment obtenir l&apos;URL ?
        </h4>
        <ol className="space-y-1 text-xs text-zinc-400">
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">1.</span>
            <span>Allez sur leboncoin.fr et effectuez votre recherche</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">2.</span>
            <span>
              Appliquez tous les filtres souhaités (prix, marque, localisation,
              etc.)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">3.</span>
            <span>Copiez l&apos;URL complète de la page de résultats</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">4.</span>
            <span>Collez l&apos;URL dans le champ ci-dessus</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
