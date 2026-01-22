"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { getLeadDetails } from "@/actions/lead.actions";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";

type LeadDrawerProps = {
  leadId: string | null;
  onClose: () => void;
};

type LeadDetails = Awaited<ReturnType<typeof getLeadDetails>>;

export function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const data = await getLeadDetails(leadId);
        setLead(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setIsLoading(false);
      }
    });
  }, [leadId]);

  if (!leadId) return null;

  // Parse pictures array from ad
  // Note: The pictures might be stored in a different field. For now, using just the main picture.
  const images = lead?.ad.picture ? [lead.ad.picture] : [];

  const hasImages = images.length > 0;

  return (
    <>
      {/* Backdrop with sophisticated fade */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          leadId ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-2xl transform bg-zinc-950 shadow-2xl transition-transform duration-500 ease-out ${
          leadId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header bar with close button */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/95 px-6 py-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-zinc-100">
            Détails du lead
          </h2>
          <button
            onClick={onClose}
            className="group rounded-lg p-2 transition-colors hover:bg-zinc-900"
            aria-label="Fermer"
          >
            <svg
              className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Scrollable content */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-500" />
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center px-6">
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {lead && !isLoading && (
            <div className="space-y-6 p-6">
              {/* Image Gallery */}
              {hasImages && (
                <section className="space-y-3">
                  {/* Main Image */}
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900">
                    <Image
                      src={images[selectedImageIndex]}
                      alt={lead.ad.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />

                    {/* Image counter overlay */}
                    <div className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                            idx === selectedImageIndex
                              ? "border-amber-500 ring-2 ring-amber-500/20"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Title and Basic Info */}
              <section className="space-y-3">
                <h3 className="text-xl font-semibold leading-tight text-zinc-100">
                  {lead.ad.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">
                      {lead.ad.price?.toLocaleString("fr-FR")} €
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {lead.ad.location.name} ({lead.ad.location.zipcode})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Publié{" "}
                      {formatDistance(
                        new Date(lead.ad.lastPublicationDate),
                        new Date(),
                        { addSuffix: true, locale: fr },
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="grid grid-cols-2 gap-3">
                {lead.ad.phoneNumber && (
                  <a
                    href={`https://wa.me/${lead.ad.phoneNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3 font-medium text-green-400 transition-all hover:border-green-800 hover:bg-green-900/40"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                )}

                {lead.ad.url && (
                  <a
                    href={lead.ad.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 rounded-lg border border-blue-900/50 bg-blue-950/30 px-4 py-3 font-medium text-blue-400 transition-all hover:border-blue-800 hover:bg-blue-900/40"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>Voir l'annonce</span>
                  </a>
                )}
              </section>

              {/* Vehicle Specs Grid */}
              {(lead.ad.brand || lead.ad.fuel || lead.ad.gearBox || lead.ad.modelYear) && (
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    Caractéristiques
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {lead.ad.brand && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Marque</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.brand.name}
                        </div>
                      </div>
                    )}
                    {lead.ad.model && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Modèle</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.model}
                        </div>
                      </div>
                    )}
                    {lead.ad.modelYear && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Année</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.modelYear}
                        </div>
                      </div>
                    )}
                    {lead.ad.mileage && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Kilométrage</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.mileage.toLocaleString("fr-FR")} km
                        </div>
                      </div>
                    )}
                    {lead.ad.fuel && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Carburant</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.fuel.name}
                        </div>
                      </div>
                    )}
                    {lead.ad.gearBox && (
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                        <div className="text-xs text-zinc-500">Boîte</div>
                        <div className="mt-1 font-medium text-zinc-200">
                          {lead.ad.gearBox.name}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Seller Info */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Vendeur
                </h4>
                <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-200">
                        {lead.ad.ownerName}
                      </div>
                      {lead.ad.phoneNumber && (
                        <div className="mt-1 text-sm text-zinc-400">
                          {lead.ad.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        lead.ad.acceptSalesmen
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {lead.ad.acceptSalesmen ? "Pro" : "Particulier"}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes Section */}
              {lead.notes && lead.notes.length > 0 && (
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    Notes ({lead.notes.length})
                  </h4>
                  <div className="space-y-2">
                    {lead.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3"
                      >
                        <p className="text-sm text-zinc-300">{note.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                          <span>{note.createdBy.name}</span>
                          <span>•</span>
                          <span>
                            {formatDistance(
                              new Date(note.createdAt),
                              new Date(),
                              { addSuffix: true, locale: fr },
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* View Full Details Button */}
              <a
                href={`/leads/${lead.id}`}
                className="block w-full rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-center font-medium text-amber-400 transition-all hover:border-amber-800 hover:bg-amber-900/40"
              >
                Voir détails complets
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
