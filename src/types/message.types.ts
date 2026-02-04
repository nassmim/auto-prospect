/**
 * Daily Contact Tracker Service
 * In-memory tracker for daily contact counts during background job execution
 * Resets naturally when job completes (no database persistence needed)
 */
export type TDailyContactTracker = {
  increment: (huntId: string, channel?: string) => number;
  getCount: (huntId: string) => number;
  isAtLimit: (huntId: string, limit: number | null | undefined) => boolean;
};
