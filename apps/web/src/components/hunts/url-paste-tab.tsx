import { Input } from "@/components/ui/input";
import { z } from "zod";

const urlSchema = z.string().url("URL invalide").or(z.literal(""));

type UrlPasteTabProps = {
  value: string;
  onChange: (value: string) => void;
};

export function UrlPasteTab({ value, onChange }: UrlPasteTabProps) {
  const handleChange = (newValue: string) => {
    const validationResult = urlSchema.safeParse(newValue);

    if (!validationResult.success && newValue !== "") {
      console.error("URL validation failed:", validationResult.error);
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="searchUrl"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          URL de recherche Leboncoin
        </label>
        <Input
          id="searchUrl"
          type="url"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://www.leboncoin.fr/recherche?category=2&..."
          className="w-full font-mono"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Effectue ta recherche sur Leboncoin, puis copie l&apos;URL complète
          ici
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
            <span>Va sur leboncoin.fr et effectue ta recherche</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">2.</span>
            <span>
              Applique tous les filtres souhaités (prix, marque, localisation,
              etc.)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">3.</span>
            <span>Copie l&apos;URL complète de la page de résultats</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-amber-500">4.</span>
            <span>Colle l&apos;URL dans le champ ci-dessus</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
