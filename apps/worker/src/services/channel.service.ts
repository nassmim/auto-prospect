import { getDBAdminClient, TDBAdminClient } from "@auto-prospect/db";
import {
  EContactChannel,
  TContactChannel,
  WHATSAPP_DAILY_LIMIT,
} from "@auto-prospect/shared";

/**
 * Gets account credit balances as a Map of channel -> remaining credits
 *
 * Special handling for WhatsApp: Always returns WHATSAPP_DAILY_LIMIT (1000)
 * regardless of database values, since WhatsApp is unlimited for users
 */
export async function getAccountChannelCreditsMap(
  accountId: string,
  db?: TDBAdminClient,
): Promise<Map<string, number>> {
  const client = db || getDBAdminClient();

  const balance = await client.query.creditBalances.findFirst({
    where: (table, { eq }) => eq(table.accountId, accountId),
  });

  if (!balance) {
    return new Map(); // No credits
  }

  return new Map([
    [EContactChannel.SMS, balance.sms],
    [EContactChannel.RINGLESS_VOICE, balance.ringlessVoice],
    [EContactChannel.WHATSAPP_TEXT, WHATSAPP_DAILY_LIMIT], // Always unlimited
  ]);
}

/**
 * Gets channel priorities ordered by priority (lowest number = highest priority)
 */
export async function getChannelPriorities(db: TDBAdminClient) {
  return db.query.channelPriorities.findMany({
    orderBy: (table, { asc }) => [asc(table.priority)],
  });
}

type TChannelAllocation = {
  adId: string;
  channel: TContactChannel;
};

type TAllocateAdsToChannelsParams = {
  accountId: string;
  huntId: string;
  adIds: string[];
  dailyPacingLimit: number | null;
  dailyContactCount: number;
  disabledChannels?: TContactChannel[]; // Channels to exclude from allocation
};

/**
 * Allocates ads to channels based on priority, available credits, and daily pacing limit
 *
 * Algorithm:
 * 1. Check daily pacing limit - stop if already reached
 * 2. Get channel priorities (lowest number = highest priority)
 * 3. For each channel in priority order:
 *    - Skip if channel is disabled (e.g., user has no WhatsApp phone number)
 *    - Check if channel has remaining credits
 *    - Allocate as many ads as possible to this channel
 *    - Respect daily pacing limit (stop if reached)
 * 4. Return allocations as (adId, channel) pairs
 */
export async function allocateAdsToChannels({
  accountId,
  huntId,
  adIds,
  dailyPacingLimit,
  dailyContactCount,
  disabledChannels = [],
  db,
}: TAllocateAdsToChannelsParams & { db: TDBAdminClient }): Promise<
  TChannelAllocation[]
> {
  // Check if already at daily limit
  if (
    dailyPacingLimit !== null &&
    dailyPacingLimit !== undefined &&
    dailyContactCount >= dailyPacingLimit
  ) {
    return []; // No more contacts allowed today
  }

  // Get channel priorities (ordered by priority ascending)
  const priorities = await getChannelPriorities(db);

  // Get account channel credits with remaining balance
  const channelCreditsMap = await getAccountChannelCreditsMap(accountId, db);

  const allocations: TChannelAllocation[] = [];
  const adsToAllocate = [...adIds]; // Copy to avoid mutation
  let currentDailyCount = dailyContactCount;

  // Process each channel in priority order
  for (const { channel } of priorities) {
    // Skip if no ads left to allocate
    if (adsToAllocate.length === 0) break;

    // Skip if channel is disabled (user doesn't have required setup)
    if (disabledChannels.includes(channel)) continue;

    // Check if we've hit the daily limit
    if (
      dailyPacingLimit !== null &&
      dailyPacingLimit !== undefined &&
      currentDailyCount >= dailyPacingLimit
    ) {
      break; // Stop allocation if daily limit reached
    }

    // Get remaining credits for this channel (channel now maps 1:1 to credit type)
    const remainingCredits = channelCreditsMap.get(channel) || 0;

    // Skip if no credits available for this channel
    if (remainingCredits <= 0) continue;

    // Calculate how many ads we can allocate to this channel
    const remainingDailySlots =
      dailyPacingLimit !== null && dailyPacingLimit !== undefined
        ? dailyPacingLimit - currentDailyCount
        : Infinity;

    const maxAllocations = Math.min(
      adsToAllocate.length,
      remainingCredits,
      remainingDailySlots,
    );

    // Allocate ads to this channel
    for (let i = 0; i < maxAllocations; i++) {
      const adId = adsToAllocate.shift()!;
      allocations.push({
        adId,
        channel,
      });
      currentDailyCount++;
    }
  }

  return allocations;
}
