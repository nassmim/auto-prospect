"use client";

type VariableToolbarProps = {
  onInsertVariable: (variable: string) => void;
};

const VARIABLES = [
  { key: "{titre_annonce}", label: "Titre annonce" },
  { key: "{prix}", label: "Prix" },
  { key: "{marque}", label: "Marque" },
  { key: "{modele}", label: "Modèle" },
  { key: "{annee}", label: "Année" },
  { key: "{ville}", label: "Ville" },
  { key: "{vendeur_nom}", label: "Vendeur" },
];

export function VariableToolbar({ onInsertVariable }: VariableToolbarProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">
        Variables disponibles
      </h3>
      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((variable) => (
          <button
            key={variable.key}
            type="button"
            onClick={() => onInsertVariable(variable.key)}
            className="rounded border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-amber-500 hover:bg-zinc-800 hover:text-amber-500"
          >
            {variable.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Cliquez sur une variable pour l'insérer dans votre message
      </p>
    </div>
  );
}
