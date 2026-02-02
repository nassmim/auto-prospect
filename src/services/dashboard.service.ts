import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { messages } from "@/schema/message.schema";
import { getTodayNewLeads, getContactedLeads } from "@/services/lead.service";
import { TDashboardStats } from "@/types/general.types";
import { and, eq, sql } from "drizzle-orm";

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
      .where(eq(messages.channel, "whatsapp"));

    // Get SMS messages count
    const smsResult = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(eq(messages.channel, "sms"));

    // Get LeBonCoin messages count (if tracked)
    const leboncoinResult = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(eq(messages.channel, "leboncoin"));

    return {
      whatsapp: whatsappResult[0]?.count ?? 0,
      sms: smsResult[0]?.count ?? 0,
      leboncoin: leboncoinResult[0]?.count ?? 0,
    };
  });

  return {
    newLeadsToday: todayLeads.todayLeadsCount,
    leadsContacted: contactedLeads.contactedLeadsCount,
    messagesSentByChannel: messagesByChannel,
  };
}
