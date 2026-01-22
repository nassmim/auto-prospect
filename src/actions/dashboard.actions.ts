"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { leads } from "@/schema/lead.schema";
import { baseFilters } from "@/schema/filter.schema";
import { messageTemplates } from "@/schema/message-template.schema";
import { organizationMembers } from "@/schema/organization.schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

/**
 * Gets the current user's primary organization ID
 * Users belong to organizations through organization_members table
 */
async function getCurrentOrganizationId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const dbClient = await createDrizzleSupabaseClient();

  // Get user's first organization (for now, we assume one org per user)
  // In future, we'll need to handle org switching via context/state
  const membership = await dbClient.rls(async (tx) => {
    return tx.query.organizationMembers.findFirst({
      where: (table, { and, eq, isNotNull }) =>
        and(
          eq(table.accountId, session.user.id),
          isNotNull(table.joinedAt),
        ),
      columns: { organizationId: true },
    });
  });

  return membership?.organizationId ?? null;
}

/**
 * Dashboard statistics for the organization
 */
export type DashboardStats = {
  newLeadsToday: number;
  leadsContacted: number;
  messagesSentByChannel: {
    whatsapp: number;
    sms: number;
    leboncoin: number;
  };
};

/**
 * Hunt summary for dashboard list
 */
export type HuntSummary = {
  id: string;
  name: string;
  status: string;
  platform: string; // derived from outreach settings
  leadCount: number;
  contactedCount: number;
  lastScanAt: Date | null;
  createdAt: Date;
};

/**
 * Fetches dashboard statistics for the current organization
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    throw new Error("No organization found for user");
  }

  const dbClient = await createDrizzleSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await dbClient.rls(async (tx) => {
    // New leads created today
    const newLeadsToday = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(
        and(
          eq(leads.organizationId, organizationId),
          gte(leads.createdAt, today),
        ),
      );

    // Leads in "contacte" stage
    const leadsContacted = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(
        and(
          eq(leads.organizationId, organizationId),
          eq(leads.stage, "contacte"),
        ),
      );

    // Messages sent by channel (from message templates used)
    // For now, return mock data until we implement message tracking
    const messagesByChannel = {
      whatsapp: 0,
      sms: 0,
      leboncoin: 0,
    };

    return {
      newLeadsToday: newLeadsToday[0]?.count ?? 0,
      leadsContacted: leadsContacted[0]?.count ?? 0,
      messagesSentByChannel: messagesByChannel,
    };
  });

  return stats;
}

/**
 * Fetches active hunts with summary data for dashboard
 */
export async function getActiveHunts(): Promise<HuntSummary[]> {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    throw new Error("No organization found for user");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const hunts = await dbClient.rls(async (tx) => {
    // Fetch hunts with lead counts
    const huntsData = await tx.query.baseFilters.findMany({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationId),
          eq(table.status, "active"),
        ),
      orderBy: (table) => [desc(table.lastScanAt), desc(table.createdAt)],
      limit: 10, // Show top 10 active hunts
    });

    // Get lead counts for each hunt
    const huntSummaries: HuntSummary[] = await Promise.all(
      huntsData.map(async (hunt) => {
        // Total leads for this hunt
        const totalLeads = await tx
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(leads)
          .where(eq(leads.huntId, hunt.id));

        // Contacted leads (stage = "contacte")
        const contactedLeads = await tx
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(leads)
          .where(
            and(eq(leads.huntId, hunt.id), eq(leads.stage, "contacte")),
          );

        // Determine primary platform from outreach settings
        const outreach = hunt.outreachSettings as {
          leboncoin?: boolean;
          whatsapp?: boolean;
          sms?: boolean;
        };
        const platform = outreach?.leboncoin
          ? "leboncoin"
          : outreach?.whatsapp
            ? "whatsapp"
            : outreach?.sms
              ? "sms"
              : "unknown";

        return {
          id: hunt.id,
          name: hunt.name,
          status: hunt.status,
          platform,
          leadCount: totalLeads[0]?.count ?? 0,
          contactedCount: contactedLeads[0]?.count ?? 0,
          lastScanAt: hunt.lastScanAt,
          createdAt: hunt.createdAt,
        };
      }),
    );

    return huntSummaries;
  });

  return hunts;
}
