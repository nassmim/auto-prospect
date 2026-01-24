/**
 * Daily Contact Tracker Service
 * In-memory tracker for daily contact counts during background job execution
 * Resets naturally when job completes (no database persistence needed)
 */

export type DailyContactTracker = {
  increment: (huntId: string, channel?: string) => number;
  getCount: (huntId: string) => number;
  getChannelCount: (huntId: string, channel: string) => number;
  isAtLimit: (huntId: string, limit: number | null | undefined) => boolean;
  getAllCounts: () => Map<string, { total: number; channels: Map<string, number> }>;
};

/**
 * Creates a new daily contact tracker instance
 * Should be instantiated at the start of each background job run
 */
export function createDailyContactTracker(): DailyContactTracker {
  // Hunt ID -> { total count, channel-specific counts }
  const huntCounts = new Map<string, { total: number; channels: Map<string, number> }>();

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
     * Gets the contact count for a specific channel on a hunt
     * @returns The count (0 if no contacts on this channel)
     */
    getChannelCount(huntId: string, channel: string): number {
      return huntCounts.get(huntId)?.channels.get(channel) || 0;
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

    /**
     * Gets all hunt counts (useful for debugging/logging)
     */
    getAllCounts() {
      return huntCounts;
    },
  };
}
