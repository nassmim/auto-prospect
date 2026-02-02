// Outreach settings type for JSONB field
type TOutreachSettings = {
  whatsapp?: boolean;
  sms?: boolean;
  ringlessVoice?: boolean;
};

// Template IDs type for JSONB field
type TMessageTemplateIds = {
  leboncoin?: string | null;
  whatsapp?: string | null;
  sms?: string | null;
  ringlessVoice?: string | null;
};

/**
 * Hunt summary for dashboard list
 */
type THuntSummary = {
  id: string;
  name: string;
  status: string;
  leadCount: number;
  contactedCount: number;
  lastScanAt: Date | null;
  createdAt: Date;
};

type TLeadsSummaryStats = {
  todayLeadsCount: number;
  contactedLeadsCount: number;
  totalLeads: number;
};
export type {
  THuntSummary,
  TLeadsSummaryStats,
  TMessageTemplateIds,
  TOutreachSettings,
};
