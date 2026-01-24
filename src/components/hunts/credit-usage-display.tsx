"use client";

import { Progress } from "@/components/ui/progress";
import { EMessageType } from "@/constants/enums";
import type { THuntChannelCredit } from "@/schema/credits.schema";

type CreditUsageDisplayProps = {
  channelCredits: THuntChannelCredit[];
  dailyPacingLimit?: number | null;
  dailyContactsCount?: number;
};

const channelLabels: Record<EMessageType, string> = {
  [EMessageType.SMS]: "SMS",
  [EMessageType.RINGLESS_VOICE]: "Voix sans sonnerie",
  [EMessageType.WHATSAPP_TEXT]: "WhatsApp",
};

export function CreditUsageDisplay({
  channelCredits,
  dailyPacingLimit,
  dailyContactsCount = 0,
}: CreditUsageDisplayProps) {
  if (!channelCredits || channelCredits.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">
          Utilisation des crédits
        </h3>
        <p className="text-sm text-zinc-500">
          Aucun crédit alloué pour cette recherche
        </p>
      </div>
    );
  }

  const dailyProgress = dailyPacingLimit
    ? Math.min((dailyContactsCount / dailyPacingLimit) * 100, 100)
    : 0;
  const dailyLimitExceeded = dailyPacingLimit && dailyContactsCount > dailyPacingLimit;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Utilisation des crédits
      </h3>

      <div className="space-y-4">
        {channelCredits.map((credit) => {
          const remaining = credit.creditsAllocated - credit.creditsConsumed;
          const progress = credit.creditsAllocated > 0
            ? (credit.creditsConsumed / credit.creditsAllocated) * 100
            : 0;

          return (
            <div key={credit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  {channelLabels[credit.channel as EMessageType]}
                </span>
                <span className="text-xs text-zinc-500">
                  {credit.creditsConsumed} / {credit.creditsAllocated} utilisés
                </span>
              </div>

              <Progress
                value={progress}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {remaining} crédits restants
                </span>
                {progress >= 100 && (
                  <span className="text-xs font-medium text-red-400">
                    Épuisé
                  </span>
                )}
                {progress >= 80 && progress < 100 && (
                  <span className="text-xs font-medium text-amber-400">
                    Bientôt épuisé
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {dailyPacingLimit && (
          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                Limite quotidienne
              </span>
              <span className="text-xs text-zinc-500">
                {dailyContactsCount} / {dailyPacingLimit} contacts
              </span>
            </div>

            <Progress
              value={dailyProgress}
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {dailyLimitExceeded
                  ? "Limite dépassée"
                  : `${dailyPacingLimit - dailyContactsCount} contacts restants aujourd'hui`}
              </span>
              {dailyLimitExceeded && (
                <span className="text-xs font-medium text-red-400">
                  Dépassé
                </span>
              )}
              {dailyProgress >= 80 && !dailyLimitExceeded && (
                <span className="text-xs font-medium text-amber-400">
                  Bientôt atteint
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
