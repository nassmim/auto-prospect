import { EContactChannel } from "@/constants/enums";

/**
 * Dashboard statistics for the account
 */
type TDashboardStats = {
  newLeadsToday: number;
  leadsContacted: number;
  messagesSentByChannel: Record<EContactChannel, number>;
};

export type { TDashboardStats };
