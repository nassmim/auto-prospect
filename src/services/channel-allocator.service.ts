/**
 * Channel Allocator Service
 * Pure business logic for allocating ads to channels based on priority, credits, and daily limits
 * Database operations delegated to server actions
 */

import { EMessageType } from "@/constants/enums";
import { DailyContactTracker } from "./daily-contact-tracker.service";
import {
  getHuntDailyPacingLimit,
  getChannelPriorities,
  getHuntChannelCreditsMap,
} from "@/actions/channel.actions";

export type ChannelAllocation = {
  adId: string;
  channel: EMessageType;
  messageType: EMessageType;
};

export type AllocateAdsToChannelsParams = {
  huntId: string;
  adIds: string[];
  dailyContactTracker: DailyContactTracker;
};


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
  // Get hunt daily pacing limit from database (bypass RLS for background job)
  const dailyPacingLimit = await getHuntDailyPacingLimit(huntId, true);

  // Check if already at daily limit
  if (dailyContactTracker.isAtLimit(huntId, dailyPacingLimit)) {
    return []; // No more contacts allowed today
  }

  // Get channel priorities (ordered by priority ascending, bypass RLS for background job)
  const priorities = await getChannelPriorities(true);

  // Get hunt channel credits with remaining balance (bypass RLS for background job)
  const channelCreditsMap = await getHuntChannelCreditsMap(huntId, true);

  const allocations: ChannelAllocation[] = [];
  const adsToAllocate = [...adIds]; // Copy to avoid mutation
  let currentDailyCount = dailyContactTracker.getCount(huntId);

  // Process each channel in priority order
  for (const { channel: messageType } of priorities) {
    // Skip if no ads left to allocate
    if (adsToAllocate.length === 0) break;

    // Check if we've hit the daily limit
    if (
      dailyPacingLimit !== null &&
      dailyPacingLimit !== undefined &&
      currentDailyCount >= dailyPacingLimit
    ) {
      break; // Stop allocation if daily limit reached
    }

    // Get remaining credits for this channel (messageType now maps 1:1 to credit type)
    const remainingCredits = channelCreditsMap.get(messageType) || 0;

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
        channel: messageType as EMessageType,
        messageType: messageType as EMessageType,
      });
      currentDailyCount++;
    }
  }

  return allocations;
}

// Re-export getChannelPriorities from server actions for convenience
export { getChannelPriorities } from "@/actions/channel.actions";
