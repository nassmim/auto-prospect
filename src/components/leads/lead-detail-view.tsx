import { pages } from "@/config/routes";
import { type LeadStage } from "@/schema/lead.schema";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

// Constants for stage labels and colors
const STAGE_LABELS: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relance",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

const STAGE_COLORS: Record<LeadStage, string> = {
  nouveau: "#3b82f6",
  contacte: "#8b5cf6",
  relance: "#f59e0b",
  negociation: "#10b981",
  gagne: "#22c55e",
  perdu: "#ef4444",
};

const CHANNEL_ICONS: Record<string, React.ReactElement> = {
  whatsapp: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  ),
  sms: (
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
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  ),
  voice: (
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
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),
  leboncoin: (
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-900/50",
  sent: "bg-blue-900/30 text-blue-400 border-blue-900/50",
  delivered: "bg-green-900/30 text-green-400 border-green-900/50",
  failed: "bg-red-900/30 text-red-400 border-red-900/50",
  read: "bg-purple-900/30 text-purple-400 border-purple-900/50",
};

// Type definitions based on action return types
type Lead = Awaited<
  ReturnType<typeof import("@/actions/lead.actions").getLeadDetails>
>;
type Message = Awaited<
  ReturnType<typeof import("@/actions/lead.actions").getLeadMessages>
>[number];
type Activity = Awaited<
  ReturnType<typeof import("@/actions/lead.actions").getLeadActivities>
>[number];

interface LeadDetailViewProps {
  lead: Lead;
  messages: Message[];
  activities: Activity[];
  leadId: string;
}

export function LeadDetailView({
  lead,
  messages,
  activities,
  leadId,
}: LeadDetailViewProps) {
  const images = lead.ad.picture ? [lead.ad.picture] : [];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Breadcrumb */}
      <div className="border-b border-zinc-800/50 bg-zinc-950/95 px-6 py-3">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href={pages.leads}
              className="text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Leads
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
            <span className="text-zinc-100">Lead #{leadId.slice(0, 8)}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Back button */}
        <Link
          href={pages.leads}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour au pipeline
        </Link>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Hero section */}
            <section className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50">
              {/* Image gallery */}
              {images.length > 0 && (
                <div className="relative aspect-video">
                  <Image
                    src={images[0]}
                    alt={lead.ad.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                </div>
              )}

              {/* Title and basic info */}
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="mb-2 text-2xl font-bold text-zinc-100">
                      {lead.ad.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-3xl font-bold text-amber-500">
                        {lead.ad.price?.toLocaleString("fr-FR")} €
                      </span>
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
                    </div>
                  </div>

                  {/* Stage badge */}
                  <div
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${STAGE_COLORS[lead.stage as LeadStage]}20`,
                      color: STAGE_COLORS[lead.stage as LeadStage],
                      borderColor: `${STAGE_COLORS[lead.stage as LeadStage]}40`,
                      borderWidth: "1px",
                    }}
                  >
                    {STAGE_LABELS[lead.stage as LeadStage]}
                  </div>
                </div>

                {/* Assignment */}
                {lead.assignedTo && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Assigné à {lead.assignedTo.name}</span>
                  </div>
                )}

                {/* Publication date */}
                <div className="text-sm text-zinc-500">
                  Publié{" "}
                  {formatDistance(
                    new Date(lead.ad.lastPublicationDate),
                    new Date(),
                    { addSuffix: true, locale: fr },
                  )}
                </div>
              </div>
            </section>

            {/* Vehicle specs */}
            <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100">
                Caractéristiques du véhicule
              </h2>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
                {lead.ad.vehicleSeats && (
                  <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                    <div className="text-xs text-zinc-500">Places</div>
                    <div className="mt-1 font-medium text-zinc-200">
                      {lead.ad.vehicleSeats.name}
                    </div>
                  </div>
                )}
                {lead.ad.vehicleState && (
                  <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                    <div className="text-xs text-zinc-500">État</div>
                    <div className="mt-1 font-medium text-zinc-200">
                      {lead.ad.vehicleState.name}
                    </div>
                  </div>
                )}
                {lead.ad.type && (
                  <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                    <div className="text-xs text-zinc-500">Type</div>
                    <div className="mt-1 font-medium text-zinc-200">
                      {lead.ad.type.name}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Description */}
            {lead.ad.description && (
              <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Description
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {lead.ad.description}
                </p>
              </section>
            )}

            {/* Message history */}
            <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100">
                Historique des messages ({messages.length})
              </h2>

              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aucun message envoyé pour ce lead
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4"
                    >
                      {/* Channel icon */}
                      <div className="flex-shrink-0 text-zinc-400">
                        {CHANNEL_ICONS[message.channel]}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`rounded border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[message.status]}`}
                          >
                            {message.status}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {message.sentAt
                              ? format(
                                  new Date(message.sentAt),
                                  "dd MMM yyyy, HH:mm",
                                  { locale: fr },
                                )
                              : "En attente"}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300">
                          {message.content}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Envoyé par {message.sentBy.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Seller info */}
            <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100">Vendeur</h2>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-zinc-200">
                    {lead.ad.ownerName}
                  </p>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      lead.ad.acceptSalesmen
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-purple-900/30 text-purple-400"
                    }`}
                  >
                    {lead.ad.acceptSalesmen ? "Pro" : "Particulier"}
                  </div>
                </div>

                {lead.ad.phoneNumber && (
                  <a
                    href={`tel:${lead.ad.phoneNumber}`}
                    className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-amber-500"
                  >
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {lead.ad.phoneNumber}
                  </a>
                )}

                {lead.ad.url && (
                  <a
                    href={lead.ad.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-amber-500"
                  >
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Voir l'annonce
                  </a>
                )}
              </div>
            </section>

            {/* Activity timeline */}
            <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100">
                Journal d&apos;activité ({activities.length})
              </h2>

              {activities.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucune activité</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="relative border-l-2 border-zinc-800 pl-4 pb-4 last:pb-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-amber-500" />

                      <div className="text-sm">
                        <p className="font-medium text-zinc-300">
                          {activity.type === "stage_change" &&
                            "Changement de statut"}
                          {activity.type === "message_sent" && "Message envoyé"}
                          {activity.type === "assignment_change" &&
                            "Assignation modifiée"}
                          {activity.type === "note_added" && "Note ajoutée"}
                          {activity.type === "reminder_set" && "Rappel créé"}
                          {activity.type === "created" && "Lead créé"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Par {activity.createdBy.name} •{" "}
                          {formatDistance(
                            new Date(activity.createdAt),
                            new Date(),
                            { addSuffix: true, locale: fr },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
