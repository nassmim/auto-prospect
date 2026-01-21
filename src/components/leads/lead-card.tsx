"use client";

import Image from "next/image";

type LeadCardProps = {
  lead: {
    id: string;
    stage: string;
    ad: {
      title: string;
      price: number | null;
      picture: string | null;
      phoneNumber: string | null;
      isWhatsappPhone: boolean | null;
      zipcode: {
        name: string;
      };
    };
  };
  onClick?: () => void;
  isDragging?: boolean;
};

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const hasPhone = !!lead.ad.phoneNumber;
  const hasWhatsApp = lead.ad.isWhatsappPhone;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-lg border bg-zinc-900 p-3 transition-all hover:border-amber-500/50 ${
        isDragging
          ? "border-amber-500 opacity-50"
          : "border-zinc-800 hover:shadow-lg hover:shadow-amber-500/10"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-zinc-800">
        {lead.ad.picture ? (
          <Image
            src={lead.ad.picture}
            alt={lead.ad.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-zinc-100">
        {lead.ad.title}
      </h3>

      {/* Price and Location */}
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-semibold text-amber-500">
          {lead.ad.price
            ? `${lead.ad.price.toLocaleString("fr-FR")} €`
            : "Prix non spécifié"}
        </span>
        <span>{lead.ad.zipcode.name}</span>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        {hasPhone && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>Tél</span>
          </div>
        )}

        {hasWhatsApp && (
          <div className="flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-1 text-xs text-green-400">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>WhatsApp</span>
          </div>
        )}

        {/* Platform badge */}
        <div className="ml-auto rounded-full bg-blue-900/30 px-2 py-1 text-xs text-blue-400">
          LBC
        </div>
      </div>
    </div>
  );
}
