"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHunt } from "@/actions/hunt-crud.actions";
import { UrlPasteTab } from "./url-paste-tab";
import { SearchBuilderTab } from "./search-builder-tab";
import { OutreachSettings } from "./outreach-settings";

type HuntFormProps = {
  hunt?: {
    id: string;
    name: string;
    locationId: number;
    radiusInKm: number;
    adTypeId: number;
    autoRefresh: boolean;
    outreachSettings?: {
      leboncoin?: boolean;
      whatsapp?: boolean;
      sms?: boolean;
    };
    templateIds?: {
      leboncoin?: string | null;
      whatsapp?: string | null;
      sms?: string | null;
    };
  };
};

export function HuntForm({ hunt }: HuntFormProps) {
  const [name, setName] = useState(hunt?.name ?? "");
  const [activeTab, setActiveTab] = useState<"url" | "builder">("url");
  const [autoRefresh, setAutoRefresh] = useState(hunt?.autoRefresh ?? true);
  const [outreachSettings, setOutreachSettings] = useState(
    hunt?.outreachSettings ?? {
      leboncoin: false,
      whatsapp: false,
      sms: false,
    },
  );
  const [templateIds, setTemplateIds] = useState(
    hunt?.templateIds ?? {
      leboncoin: null,
      whatsapp: null,
      sms: null,
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // URL paste tab state
  const [searchUrl, setSearchUrl] = useState("");

  // Search builder tab state (stub for Phase 2)
  const [searchFilters, setSearchFilters] = useState({
    platform: "leboncoin",
    priceMin: 0,
    priceMax: null,
    mileageMin: 0,
    mileageMax: null,
    brands: [] as string[],
    location: "",
    radius: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }

    // For MVP, we only support URL paste
    if (activeTab === "url" && !searchUrl.trim()) {
      setError("Veuillez coller une URL de recherche Leboncoin");
      return;
    }

    setIsSaving(true);

    try {
      // For MVP, we'll use hardcoded values for locationId and adTypeId
      // In Phase 2, these will be parsed from the URL or selected in search builder
      await createHunt({
        name,
        locationId: 1, // TODO: Parse from URL or get from search builder
        radiusInKm: 0,
        adTypeId: 1, // TODO: Parse from URL or get from search builder
        autoRefresh,
        outreachSettings,
        templateIds,
      });

      router.push("/hunts");
    } catch (err) {
      console.error("Failed to create hunt:", err);
      setError(err instanceof Error ? err.message : "Failed to create hunt");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Name input */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Nom de la recherche
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Peugeot 308 GTI Paris"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* Search Definition Tabs */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">
          Définir la recherche
        </h3>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "url"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Coller une URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "builder"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Constructeur de recherche
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "url" && (
          <UrlPasteTab value={searchUrl} onChange={setSearchUrl} />
        )}
        {activeTab === "builder" && (
          <SearchBuilderTab value={searchFilters} onChange={setSearchFilters} />
        )}
      </div>

      {/* Auto-refresh toggle */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-3">
          <input
            id="autoRefresh"
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
          />
          <div>
            <label htmlFor="autoRefresh" className="text-sm font-medium text-zinc-300">
              Rafraîchissement automatique
            </label>
            <p className="text-xs text-zinc-500">
              Recherche automatiquement de nouvelles annonces tous les jours
            </p>
          </div>
        </div>
      </div>

      {/* Outreach Settings */}
      <OutreachSettings
        outreachSettings={outreachSettings}
        templateIds={templateIds}
        onOutreachChange={setOutreachSettings}
        onTemplateChange={setTemplateIds}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Création..." : hunt ? "Enregistrer" : "Créer la recherche"}
        </button>
      </div>
    </form>
  );
}
