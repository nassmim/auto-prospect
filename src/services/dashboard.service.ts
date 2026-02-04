import { EContactChannel } from "@/config/message.config";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { messages } from "@/schema/message.schema";
import { getContactedLeads, getTodayNewLeads } from "@/services/lead.service";
import { TDashboardStats } from "@/types/general.types";
import { eq, sql } from "drizzle-orm";

/**
 * Fetches dashboard statistics for the current user's account
 * Aggregates: today's new leads, contacted leads, and messages by channel
 */
export async function getDashboardStats(): Promise<TDashboardStats> {
  const dbClient = await createDrizzleSupabaseClient();

  // Fetch lead stats in parallel
  const [todayLeads, contactedLeads] = await Promise.all([
    getTodayNewLeads(undefined, dbClient),
    getContactedLeads(undefined, dbClient),
  ]);

  // Count messages by channel
  const messagesByChannel = await dbClient.rls(async (tx) => {
    // Get WhatsApp messages count
    const whatsappResult = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(eq(messages.channel, EContactChannel.WHATSAPP_TEXT));

    // Get SMS messages count
    const smsResult = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(eq(messages.channel, EContactChannel.SMS));

    // Get Ringless Voice messages count
    const ringlessVoiceResult = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(eq(messages.channel, EContactChannel.RINGLESS_VOICE));

    return {
      [EContactChannel.WHATSAPP_TEXT]: whatsappResult[0]?.count ?? 0,
      [EContactChannel.SMS]: smsResult[0]?.count ?? 0,
      [EContactChannel.RINGLESS_VOICE]: ringlessVoiceResult[0]?.count ?? 0,
    };
  });

  return {
    newLeadsToday: todayLeads.todayLeadsCount,
    leadsContacted: contactedLeads.contactedLeadsCount,
    messagesSentByChannel: messagesByChannel,
  };
}
