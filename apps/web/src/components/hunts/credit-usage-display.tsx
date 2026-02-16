"use client";

import { Progress } from "@/components/ui/progress";
import { EContactChannel } from "@auto-prospect/shared";
import { getContactChannelLabel } from "@auto-prospect/shared/src/config/message.config";

type CreditUsageDisplayProps = {
  accountBalance?: {
    sms: number;
    ringlessVoice: number;
    whatsappText: number;
  };
  dailyPacingLimit?: number | null;
  dailyContactsCount?: number;
};

export function CreditUsageDisplay({
  accountBalance,
  dailyPacingLimit,
  dailyContactsCount = 0,
}: CreditUsageDisplayProps) {
  if (!accountBalance) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">
          Crédits disponibles
        </h3>
        <p className="text-sm text-zinc-500">
          Chargement des crédits...
        </p>
      </div>
    );
  }

  const dailyProgress = dailyPacingLimit
    ? Math.min((dailyContactsCount / dailyPacingLimit) * 100, 100)
    : 0;
  const dailyLimitExceeded =
    dailyPacingLimit && dailyContactsCount > dailyPacingLimit;

  const channelBalances = [
    {
      channel: EContactChannel.SMS,
      label: getContactChannelLabel(EContactChannel.SMS),
      credits: accountBalance.sms,
    },
    {
      channel: EContactChannel.RINGLESS_VOICE,
      label: getContactChannelLabel(EContactChannel.RINGLESS_VOICE),
      credits: accountBalance.ringlessVoice,
    },
    {
      channel: EContactChannel.WHATSAPP_TEXT,
      label: getContactChannelLabel(EContactChannel.WHATSAPP_TEXT),
      credits: null,
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Crédits disponibles
      </h3>

      <div className="space-y-4">
        {channelBalances.map(({ channel, label, credits }) => (
          <div key={channel} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                {label}
              </span>
              <span className="text-xs text-zinc-500">
                {credits === null
                  ? "Illimité"
                  : `${credits.toLocaleString("fr-FR")} disponibles`}
              </span>
            </div>

            {credits !== null && (
              <div className="flex items-center">
                {credits === 0 ? (
                  <span className="text-xs font-medium text-red-400">
                    Crédits épuisés
                  </span>
                ) : credits < 10 ? (
                  <span className="text-xs font-medium text-amber-400">
                    Crédits faibles
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}

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

            <Progress value={dailyProgress} className="h-2" />

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
