/**
 * Hunt summary for dashboard list
 */
export type THuntSummary = {
  id: string;
  name: string;
  status: string;
  leadCount: number;
  contactedCount: number;
  lastScanAt: Date | null;
  createdAt: Date;
};
