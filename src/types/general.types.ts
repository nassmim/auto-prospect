import { EContactChannel } from "@/config/message.config";

/**
 * Dashboard statistics for the account
 */
type TDashboardStats = {
  newLeadsToday: number;
  leadsContacted: number;
  messagesSentByChannel: Record<EContactChannel, number>;
};

export type { TDashboardStats };
