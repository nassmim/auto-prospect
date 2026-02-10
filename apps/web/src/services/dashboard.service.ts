import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { messages } from "@/schema/message.schema";
import { getContactedLeads, getTodayNewLeads } from "@/services/lead.service";
import {
  EContactChannel,
  TContactChannel,
} from "@auto-prospect/shared/src/config/message.config";
import { eq, sql } from "drizzle-orm";

/**
 * Dashboard statistics for the account
 */
type TDashboardStats = {
  newLeadsToday: number;
  leadsContacted: number;
  messagesSentByChannel: Record<TContactChannel, number>;
};

/**
 * Fetches dashboard statistics for the current user's account
 * Aggregates: today's new leads, contacted leads, and messages by channel
 */
export async function getDashboardStats(): Promise<TDashboardStats> {
  const dbClient = await createDrizzleSupabaseClient();

  // Fetch lead stats and message stats in parallel (independent queries)
  const [leadStats, messageStats] = await Promise.all([
    // Lead stats in one RLS transaction
    dbClient.rls(async (tx) => {
      const [todayLeads, contactedLeads] = await Promise.all([
        getTodayNewLeads({ tx }),
        getContactedLeads({ tx }),
      ]);

      return {
        newLeadsToday: todayLeads.todayLeadsCount,
        leadsContacted: contactedLeads.contactedLeadsCount,
      };
    }),

    // Message counts in separate RLS transaction
    dbClient.rls(async (tx) => {
      // Count messages for each channel in parallel
      const channels = [
        EContactChannel.WHATSAPP_TEXT,
        EContactChannel.SMS,
        EContactChannel.RINGLESS_VOICE,
      ] as const;

      const channelCounts = await Promise.all(
        channels.map(async (channel) => {
          const result = await tx
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(messages)
            .where(eq(messages.channel, channel));

          return { channel, count: result[0]?.count ?? 0 };
        }),
      );

      // Transform array to object
      return channelCounts.reduce(
        (acc, { channel, count }) => {
          acc[channel] = count;
          return acc;
        },
        {} as Record<TContactChannel, number>,
      );
    }),
  ]);

  return {
    ...leadStats,
    messagesSentByChannel: messageStats,
  };
}
