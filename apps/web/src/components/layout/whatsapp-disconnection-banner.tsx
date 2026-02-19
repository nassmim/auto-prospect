"use client";

import { pages } from "@/config/routes";
import Link from "next/link";
import { useState } from "react";

type WhatsAppDisconnectionBannerProps = {
  isDisconnected: boolean;
};

/**
 * Global WhatsApp Disconnection Warning Banner
 * Shows at the top of all dashboard pages when WhatsApp session is disconnected
 */
export function WhatsAppDisconnectionBanner({
  isDisconnected,
}: WhatsAppDisconnectionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or not disconnected
  if (isDismissed || !isDisconnected) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">
              WhatsApp déconnecté
            </p>
            <p className="mt-0.5 text-xs text-amber-300/90">
              Ta session WhatsApp a été déconnectée. Reconnecte-toi pour
              continuer à envoyer des messages.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={pages.settings}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Reconnecter
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="cursor-pointer rounded-lg p-1.5 text-amber-400 transition-colors hover:bg-amber-500/20"
            aria-label="Fermer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
