/**
 * Dashboard statistics for the account
 */
type TDashboardStats = {
  newLeadsToday: number;
  leadsContacted: number;
  messagesSentByChannel: {
    whatsapp: number;
    sms: number;
    leboncoin: number;
  };
};

export type { TDashboardStats };
