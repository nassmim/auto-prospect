import { TDailyContactTracker } from "@auto-prospect/shared";

/**
 * Creates a new daily contact tracker instance
 * Should be instantiated at the start of each background job run
 */
export function createDailyContactTracker(): TDailyContactTracker {
  // Hunt ID -> { total count, channel-specific counts }
  const huntCounts = new Map<
    string,
    { total: number; channels: Map<string, number> }
  >();

  return {
    /**
     * Increments the contact count for a hunt and optionally tracks per-channel
     * @returns The new total count for this hunt
     */
    increment(huntId: string, channel?: string): number {
      let huntData = huntCounts.get(huntId);

      if (!huntData) {
        huntData = { total: 0, channels: new Map() };
        huntCounts.set(huntId, huntData);
      }

      // Increment total
      huntData.total += 1;

      // Increment channel-specific count if provided
      if (channel) {
        const channelCount = huntData.channels.get(channel) || 0;
        huntData.channels.set(channel, channelCount + 1);
      }

      return huntData.total;
    },

    /**
     * Gets the current total contact count for a hunt
     * @returns The count (0 if hunt has no contacts yet)
     */
    getCount(huntId: string): number {
      return huntCounts.get(huntId)?.total || 0;
    },

    /**
     * Checks if a hunt has reached its daily pacing limit
     * @param limit - The daily pacing limit (null/undefined means no limit)
     * @returns true if at or above limit, false otherwise
     */
    isAtLimit(huntId: string, limit: number | null | undefined): boolean {
      // No limit configured means never at limit
      if (limit === null || limit === undefined) {
        return false;
      }

      const count = huntCounts.get(huntId)?.total || 0;
      return count >= limit;
    },
  };
}
