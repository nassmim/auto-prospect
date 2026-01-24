// Outreach settings type for JSONB field
type TOutreachSettings = {
  leboncoin?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
};

// Template IDs type for JSONB field
type TMessageTemplateIds = {
  leboncoin?: string | null;
  whatsapp?: string | null;
  sms?: string | null;
};

export type { TMessageTemplateIds, TOutreachSettings };
