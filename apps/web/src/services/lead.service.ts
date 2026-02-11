import {
  createDrizzleSupabaseClient,
  TDBClient,
  TDBQuery,
} from "@/lib/drizzle/dbClient";
import { leads } from "@/schema/lead.schema";
import { messages } from "@/schema/message.schema";
import { ELeadStage } from "@auto-prospect/shared/src/config/lead.config";
import { and, eq, gte, sql } from "@auto-prospect/db";
import type { SQL } from "@auto-prospect/db";
import { createClient } from "../../../../packages/db/src/supabase/server";

type TLeadsSummaryStats = {
  todayLeadsCount: number;
  contactedLeadsCount: number;
  totalLeads: number;
};

/**
 * Fetch complete lead details with all relations
 * Used by lead drawer and full page view
 */
export async function getLeadDetails(leadId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Fetch lead with all ad relations
    const leadData = await dbClient.rls(async (tx) => {
      return tx.query.leads.findFirst({
        where: eq(leads.id, leadId),
        with: {
          ad: {
            with: {
              brand: true,
              fuel: true,
              gearBox: true,
              location: true,
              type: true,
              subtype: true,
              vehicleState: true,
              vehicleSeats: true,
              drivingLicence: true,
            },
          },
          assignedTo: {
            columns: {
              id: true,
              name: true,
            },
          },
          notes: {
            orderBy: (notes, { desc }) => [desc(notes.createdAt)],
          },
          reminders: {
            orderBy: (reminders, { asc }) => [asc(reminders.dueAt)],
          },
        },
      });
    });

    if (!leadData) {
      throw new Error("Lead not found");
    }

    return leadData;
  } catch (error) {
    console.error("Error fetching lead details:", error);
    throw new Error("Failed to fetch lead details");
  }
}

/**
 * Fetch all members of the lead's account for assignment dropdown
 */
export async function getLeadAssociatedTeamMembers(leadId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // First, get the lead's account
    const lead = await dbClient.rls(async (tx) => {
      return tx.query.leads.findFirst({
        where: eq(leads.id, leadId),
        columns: {
          accountId: true,
        },
      });
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Fetch all members of this account
    return await dbClient.rls(async (tx) =>
      tx.query.teamMembers.findMany({
        where: (table, { eq }) => eq(table.accountId, lead.accountId),
      }),
    );
  } catch (error) {
    console.error("Error fetching account members:", error);
    throw new Error("Failed to fetch account members");
  }
}

/**
 * Fetch message history for a lead
 */
export async function getLeadMessages(leadId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    const messagesList = await dbClient.rls(async (tx) => {
      return tx.query.messages.findMany({
        where: eq(messages.leadId, leadId),
        with: {
          sentBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.sentAt)],
      });
    });

    return messagesList;
  } catch (error) {
    console.error("Error fetching lead messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

/**
 * Fetch activity timeline for a lead
 */
export async function getLeadActivities(leadId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    const activitiesList = await dbClient.rls(async (tx) => {
      return tx.query.leadActivities.findMany({
        where: (table, { eq }) => eq(table.leadId, leadId),
        with: {
          lead: {
            with: {
              assignedTo: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    });

    return activitiesList;
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    throw new Error("Failed to fetch activities");
  }
}

/**
 * Fetches leads acquired today
 */
export async function getTodayNewLeads(options?: {
  huntId?: string;
  dbClient?: TDBClient;
  tx?: TDBQuery;
}): Promise<{ todayLeadsCount: number }> {
  const { huntId, dbClient, tx } = options || {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build where conditions dynamically based on whether huntId is provided
  const whereConditions = [gte(leads.createdAt, today)];

  if (huntId) {
    whereConditions.push(eq(leads.huntId, huntId));
  }

  // If transaction provided, use it directly; otherwise create new RLS transaction
  if (tx) {
    const todayLeads = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(and(...whereConditions));

    return {
      todayLeadsCount: todayLeads[0]?.count ?? 0,
    };
  }

  const client = dbClient || (await createDrizzleSupabaseClient());
  const todayLeads = await client.rls(async (tx) =>
    tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(and(...whereConditions)),
  );

  return {
    todayLeadsCount: todayLeads[0]?.count ?? 0,
  };
}

/**
 * Fetches the number of leads contacted
 */
export async function getContactedLeads(options?: {
  huntId?: string;
  dbClient?: TDBClient;
  tx?: TDBQuery;
}): Promise<{ contactedLeadsCount: number }> {
  const { huntId, dbClient, tx } = options || {};

  // Build where conditions dynamically based on whether huntId is provided
  const whereConditions = [eq(leads.stage, ELeadStage.CONTACTED)];

  if (huntId) {
    whereConditions.push(eq(leads.huntId, huntId));
  }

  // If transaction provided, use it directly; otherwise create new RLS transaction
  if (tx) {
    const contactedLeads = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(and(...whereConditions));

    return {
      contactedLeadsCount: contactedLeads[0]?.count ?? 0,
    };
  }

  const client = dbClient || (await createDrizzleSupabaseClient());
  const contactedLeads = await client.rls(async (tx) =>
    tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(and(...whereConditions)),
  );

  return {
    contactedLeadsCount: contactedLeads[0]?.count ?? 0,
  };
}

/**
 * Fetches the total number of leads
 */
export async function getTotalLeads(options?: {
  huntId?: string;
  dbClient?: TDBClient;
  tx?: TDBQuery;
}): Promise<{ totalLeads: number }> {
  const { huntId, dbClient, tx } = options || {};

  // Build where conditions dynamically based on whether huntId is provided
  let whereConditions: SQL<unknown> | undefined;
  if (huntId) whereConditions = eq(leads.huntId, huntId);

  // If transaction provided, use it directly; otherwise create new RLS transaction
  if (tx) {
    const totalLeads = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(whereConditions);

    return {
      totalLeads: totalLeads[0]?.count ?? 0,
    };
  }

  const client = dbClient || (await createDrizzleSupabaseClient());
  const totalLeads = await client.rls(async (tx) =>
    tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(leads)
      .where(whereConditions),
  );

  return {
    totalLeads: totalLeads[0]?.count ?? 0,
  };
}

/**
 * Fetches summary statistics for leads
 * @param huntId - Optional hunt ID to filter by specific hunt. If not provided, returns global stats for all hunts.
 */
export async function getLeadsSummaryStats(
  huntId?: string,
): Promise<TLeadsSummaryStats> {
  const dbClient = await createDrizzleSupabaseClient();

  const summaryStats = await Promise.all([
    getTodayNewLeads({ huntId, dbClient }),
    getContactedLeads({ huntId, dbClient }),
    getTotalLeads({ huntId, dbClient }),
  ]);

  return {
    todayLeadsCount: summaryStats[0].todayLeadsCount,
    contactedLeadsCount: summaryStats[1].contactedLeadsCount,
    totalLeads: summaryStats[2].totalLeads,
  };
}

/**
 * Fetches all leads for the pipeline/kanban view with minimal ad details
 * Returns leads grouped for easy rendering in Kanban columns
 */
export async function getPipelineLeads() {
  const dbClient = await createDrizzleSupabaseClient();

  const pipelineLeads = await dbClient.rls(async (tx) => {
    const rawLeads = await tx.query.leads.findMany({
      orderBy: (table, { asc }) => [asc(table.stage), asc(table.position)],
      with: {
        ad: {
          columns: {
            id: true,
            title: true,
            price: true,
            picture: true,
            phoneNumber: true,
            isWhatsappPhone: true,
          },
          with: {
            location: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform to match KanbanView expected structure
    return rawLeads.map((lead) => ({
      id: lead.id,
      stage: lead.stage,
      position: lead.position,
      ad: {
        title: lead.ad.title,
        price: lead.ad.price,
        picture: lead.ad.picture,
        phoneNumber: lead.ad.phoneNumber,
        isWhatsappPhone: lead.ad.isWhatsappPhone,
        zipcode: {
          name: lead.ad.location.name,
        },
      },
    }));
  });

  return pipelineLeads;
}

export type TPipelineLead = Awaited<
  ReturnType<typeof getPipelineLeads>
>[number];
