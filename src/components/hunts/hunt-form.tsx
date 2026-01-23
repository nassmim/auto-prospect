"use client";

import { createHunt } from "@/actions/hunt-crud.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pages } from "@/config/routes";
import { huntFormSchema, type HuntFormData } from "@/validation-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { OutreachSettings } from "./outreach-settings";
import { SearchBuilderTab } from "./search-builder-tab";
import { UrlPasteTab } from "./url-paste-tab";

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
  const [activeTab, setActiveTab] = useState<"url" | "builder">("url");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // URL paste tab state (not part of form validation yet - MVP feature)
  const [searchUrl, setSearchUrl] = useState("");

  // Search builder tab state (stub for Phase 2)
  const [searchFilters, setSearchFilters] = useState<{
    platform: string;
    priceMin: number;
    priceMax: number | null;
    mileageMin: number;
    mileageMax: number | null;
    brands: string[];
    location: string;
    radius: number;
  }>({
    platform: "leboncoin",
    priceMin: 0,
    priceMax: null,
    mileageMin: 0,
    mileageMax: null,
    brands: [],
    location: "",
    radius: 0,
  });

  const form = useForm<HuntFormData>({
    resolver: zodResolver(huntFormSchema),
    defaultValues: {
      name: hunt?.name ?? "",
      autoRefresh: hunt?.autoRefresh ?? true,
      outreachSettings: hunt?.outreachSettings ?? {
        leboncoin: false,
        whatsapp: false,
        sms: false,
      },
      templateIds: hunt?.templateIds ?? {
        leboncoin: null,
        whatsapp: null,
        sms: null,
      },
    },
  });

  // Watch form values for OutreachSettings component
  const outreachSettings = useWatch({
    control: form.control,
    name: "outreachSettings",
    defaultValue: { leboncoin: false, whatsapp: false, sms: false },
  });

  const templateIds = useWatch({
    control: form.control,
    name: "templateIds",
    defaultValue: { leboncoin: null, whatsapp: null, sms: null },
  });

  const handleSubmit = async (data: HuntFormData) => {
    setError(null);

    // For MVP, we only support URL paste
    if (activeTab === "url" && !searchUrl.trim()) {
      setError("Veuillez coller une URL de recherche Leboncoin");
      return;
    }

    try {
      // For MVP, we'll use hardcoded values for locationId and adTypeId
      // In Phase 2, these will be parsed from the URL or selected in search builder
      await createHunt({
        name: data.name,
        locationId: 1, // TODO: Parse from URL or get from search builder
        radiusInKm: 0,
        adTypeId: 1, // TODO: Parse from URL or get from search builder
        autoRefresh: data.autoRefresh,
        outreachSettings: data.outreachSettings,
        templateIds: data.templateIds,
      });

      router.push(pages.hunts);
    } catch (err) {
      console.error("Failed to create hunt:", err);
      setError(err instanceof Error ? err.message : "Failed to create hunt");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Name input */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-300">
                  Nom de la recherche
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Peugeot 308 GTI Paris"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Search Definition Tabs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">
            Définir la recherche
          </h3>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "url" | "builder")}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="url">Coller une URL</TabsTrigger>
              <TabsTrigger value="builder">
                Constructeur de recherche
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <UrlPasteTab value={searchUrl} onChange={setSearchUrl} />
            </TabsContent>

            <TabsContent value="builder">
              <SearchBuilderTab
                value={searchFilters}
                onChange={setSearchFilters}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Auto-refresh toggle */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <FormField
            control={form.control}
            name="autoRefresh"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium text-zinc-300 cursor-pointer">
                      Rafraîchissement automatique
                    </FormLabel>
                    <p className="text-xs text-zinc-500">
                      Recherche automatiquement de nouvelles annonces tous les
                      jours
                    </p>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Outreach Settings */}
        <OutreachSettings
          outreachSettings={
            outreachSettings ?? {
              leboncoin: false,
              whatsapp: false,
              sms: false,
            }
          }
          templateIds={
            templateIds ?? { leboncoin: null, whatsapp: null, sms: null }
          }
          onOutreachChange={(value) => form.setValue("outreachSettings", value)}
          onTemplateChange={(value) => form.setValue("templateIds", value)}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {form.formState.isSubmitting
              ? "Création..."
              : hunt
                ? "Enregistrer"
                : "Créer la recherche"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
