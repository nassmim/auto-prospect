// Outreach settings type for JSONB field
type TOutreachSettings = {
  leboncoin?: boolean;
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

export type { TMessageTemplateIds, TOutreachSettings };
