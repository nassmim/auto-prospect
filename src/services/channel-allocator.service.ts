/**
 * Channel Allocator Service
 * Allocates ads to communication channels based on priority, credits, and daily limits
 * Used by background jobs to determine which ads to contact via which channel
 */

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { channelPriorities } from "@/schema/general.schema";
import { huntChannelCredits } from "@/schema/credits.schema";
import { hunts } from "@/schema/hunt.schema";
import { ECreditType, EMessageType } from "@/constants/enums";
import { eq, asc } from "drizzle-orm";
import { DailyContactTracker } from "./daily-contact-tracker.service";

export type ChannelAllocation = {
  adId: string;
  channel: ECreditType;
  messageType: EMessageType;
};

export type AllocateAdsToChannelsParams = {
  huntId: string;
  adIds: string[];
  dailyContactTracker: DailyContactTracker;
};

/**
 * Maps credit types to message types for database tracking
 */
function creditTypeToMessageType(creditType: ECreditType): EMessageType {
  switch (creditType) {
    case ECreditType.SMS:
      return EMessageType.SMS;
    case ECreditType.WHATSAPP_TEXT:
      return EMessageType.WHATSAPP_TEXT;
    case ECreditType.RINGLESS_VOICE:
      return EMessageType.RINGLESS_VOICE;
  }
}

/**
 * Maps message types (from channel priorities table) to credit types
 */
function messageTypeToCreditType(messageType: EMessageType): ECreditType {
  switch (messageType) {
    case EMessageType.SMS:
      return ECreditType.SMS;
    case EMessageType.WHATSAPP_TEXT:
      return ECreditType.WHATSAPP_TEXT;
    case EMessageType.RINGLESS_VOICE:
      return ECreditType.RINGLESS_VOICE;
  }
}

/**
 * Allocates ads to channels based on priority, available credits, and daily pacing limit
 *
 * Algorithm:
 * 1. Check daily pacing limit - stop if already reached
 * 2. Get channel priorities (lowest number = highest priority)
 * 3. For each channel in priority order:
 *    - Check if channel has remaining credits
 *    - Allocate as many ads as possible to this channel
 *    - Respect daily pacing limit (stop if reached)
 * 4. Return allocations as (adId, channel) pairs
 */
export async function allocateAdsToChannels({
  huntId,
  adIds,
  dailyContactTracker,
}: AllocateAdsToChannelsParams): Promise<ChannelAllocation[]> {
  const dbClient = await createDrizzleSupabaseClient();

  // Get hunt daily pacing limit
  const [hunt] = await dbClient.admin
    .select({ dailyPacingLimit: hunts.dailyPacingLimit })
    .from(hunts)
    .where(eq(hunts.id, huntId));

  if (!hunt) {
    throw new Error(`Hunt not found: ${huntId}`);
  }

  // Check if already at daily limit
  if (dailyContactTracker.isAtLimit(huntId, hunt.dailyPacingLimit)) {
    return []; // No more contacts allowed today
  }

  // Get channel priorities (ordered by priority ascending)
  const priorities = await dbClient.admin
    .select()
    .from(channelPriorities)
    .orderBy(asc(channelPriorities.priority));

  // Get hunt channel credits with remaining balance
  const channelCreditsRaw = await dbClient.admin
    .select()
    .from(huntChannelCredits)
    .where(eq(huntChannelCredits.huntId, huntId));

  // Calculate remaining credits per channel
  const channelCreditsMap = new Map(
    channelCreditsRaw.map((cc) => [
      cc.channel,
      cc.creditsAllocated - cc.creditsConsumed,
    ]),
  );

  const allocations: ChannelAllocation[] = [];
  const adsToAllocate = [...adIds]; // Copy to avoid mutation
  let currentDailyCount = dailyContactTracker.getCount(huntId);

  // Process each channel in priority order
  for (const { channel: messageType } of priorities) {
    // Skip if no ads left to allocate
    if (adsToAllocate.length === 0) break;

    // Check if we've hit the daily limit
    if (
      hunt.dailyPacingLimit !== null &&
      hunt.dailyPacingLimit !== undefined &&
      currentDailyCount >= hunt.dailyPacingLimit
    ) {
      break; // Stop allocation if daily limit reached
    }

    // Convert message type to credit type
    const creditType = messageTypeToCreditType(messageType);

    // Get remaining credits for this channel
    const remainingCredits = channelCreditsMap.get(creditType) || 0;

    // Skip if no credits available for this channel
    if (remainingCredits <= 0) continue;

    // Calculate how many ads we can allocate to this channel
    const remainingDailySlots =
      hunt.dailyPacingLimit !== null && hunt.dailyPacingLimit !== undefined
        ? hunt.dailyPacingLimit - currentDailyCount
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
        channel: creditType,
        messageType,
      });
      currentDailyCount++;
    }
  }

  return allocations;
}

/**
 * Gets channel priorities in order (lowest priority number first)
 * Useful for displaying channel order to users
 */
export async function getChannelPriorities() {
  const dbClient = await createDrizzleSupabaseClient();

  return dbClient.admin
    .select()
    .from(channelPriorities)
    .orderBy(asc(channelPriorities.priority));
}
