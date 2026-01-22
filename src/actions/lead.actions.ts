"use server";

import { revalidatePath } from "next/cache";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { leads, leadNotes, type LeadStage } from "@/schema/lead.schema";
import { organizationMembers } from "@/schema/organization.schema";
import { accounts } from "@/schema/account.schema";
import { messages, type MessageChannel } from "@/schema/message.schema";
import { messageTemplates } from "@/schema/message-template.schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { renderTemplate, extractLeadVariables } from "@/services/message.service";

/**
 * Updates a lead's stage and logs the activity
 * Used when dragging leads between Kanban columns
 */
export async function updateLeadStage(leadId: string, newStage: LeadStage) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // RLS query wrapper - enforces organization access
    await dbClient.rls(async (tx) => {
      // Update lead stage and updatedAt timestamp
      await tx
        .update(leads)
        .set({
          stage: newStage,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Log activity as a note
      await tx.insert(leadNotes).values({
        leadId,
        content: `Stage changé vers: ${newStage}`,
        createdById: session.user.id,
      });
    });

    revalidatePath("/leads");

    return { success: true };
  } catch (error) {
    console.error("Error updating lead stage:", error);
    throw new Error("Failed to update lead stage");
  }
}

/**
 * Updates the position of a lead within its stage (for drag reordering)
 */
export async function updateLeadPosition(
  leadId: string,
  newPosition: number,
  newStage?: LeadStage,
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const updateData: { position: number; updatedAt: Date; stage?: string } = {
      position: newPosition,
      updatedAt: new Date(),
    };

    if (newStage) {
      updateData.stage = newStage;
    }

    await dbClient.rls(async (tx) => {
      await tx.update(leads).set(updateData).where(eq(leads.id, leadId));
    });

    revalidatePath("/leads");

    return { success: true };
  } catch (error) {
    console.error("Error updating lead position:", error);
    throw new Error("Failed to update lead position");
  }
}

/**
 * Bulk update multiple leads (stage, assignment, etc.)
 * Used for bulk actions in list view
 */
export async function bulkUpdateLeads(
  leadIds: string[],
  updates: {
    stage?: LeadStage;
    assignedToId?: string | null;
  },
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (leadIds.length === 0) {
    return { success: true, count: 0 };
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Update all leads
    const updateData: {
      updatedAt: Date;
      stage?: string;
      assignedToId?: string | null;
    } = {
      updatedAt: new Date(),
    };

    if (updates.stage !== undefined) {
      updateData.stage = updates.stage;
    }
    if (updates.assignedToId !== undefined) {
      updateData.assignedToId = updates.assignedToId;
    }

    await dbClient.rls(async (tx) => {
      await tx.update(leads).set(updateData).where(inArray(leads.id, leadIds));

      // Log bulk action as notes for each lead
      const noteContent: string[] = [];
      if (updates.stage) noteContent.push(`Stage: ${updates.stage}`);
      if (updates.assignedToId !== undefined)
        noteContent.push(
          `Assigné à: ${updates.assignedToId || "Non assigné"}`,
        );

      if (noteContent.length > 0) {
        await tx.insert(leadNotes).values(
          leadIds.map((leadId) => ({
            leadId,
            content: `Action groupée - ${noteContent.join(", ")}`,
            createdById: session.user.id,
          })),
        );
      }
    });

    revalidatePath("/leads");

    return { success: true, count: leadIds.length };
  } catch (error) {
    console.error("Error bulk updating leads:", error);
    throw new Error("Failed to bulk update leads");
  }
}

/**
 * Assign a lead to a user
 */
export async function assignLead(leadId: string, userId: string | null) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    await dbClient.rls(async (tx) => {
      await tx
        .update(leads)
        .set({
          assignedToId: userId,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Log assignment
      await tx.insert(leadNotes).values({
        leadId,
        content: userId
          ? `Lead assigné à un utilisateur`
          : `Lead non assigné`,
        createdById: session.user.id,
      });
    });

    revalidatePath("/leads");

    return { success: true };
  } catch (error) {
    console.error("Error assigning lead:", error);
    throw new Error("Failed to assign lead");
  }
}

/**
 * Fetch complete lead details with all relations
 * Used by lead drawer and full page view
 */
export async function getLeadDetails(leadId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

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
            with: {
              createdBy: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: (notes, { desc }) => [desc(notes.createdAt)],
          },
          reminders: {
            with: {
              createdBy: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
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
 * Fetch all members of the lead's organization for assignment dropdown
 */
export async function getOrganizationMembers(leadId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // First, get the lead's organization
    const lead = await dbClient.rls(async (tx) => {
      return tx.query.leads.findFirst({
        where: eq(leads.id, leadId),
        columns: {
          organizationId: true,
        },
      });
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Fetch all members of this organization
    const members = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.organizationId, lead.organizationId),
          isNotNull(organizationMembers.joinedAt),
        ),
        with: {
          account: {
            columns: {
              id: true,
              name: true,
              email: true,
              pictureUrl: true,
            },
          },
        },
      });
    });

    return members.map((m) => m.account);
  } catch (error) {
    console.error("Error fetching organization members:", error);
    throw new Error("Failed to fetch organization members");
  }
}

/**
 * Get the default WhatsApp template for the organization
 */
export async function getDefaultWhatsAppTemplate(leadId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // First get the lead's organization
    const lead = await dbClient.rls(async (tx) => {
      return tx.query.leads.findFirst({
        where: eq(leads.id, leadId),
        columns: {
          organizationId: true,
        },
      });
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Get the default WhatsApp template
    const template = await dbClient.rls(async (tx) => {
      return tx.query.messageTemplates.findFirst({
        where: and(
          eq(messageTemplates.organizationId, lead.organizationId),
          eq(messageTemplates.channel, "whatsapp"),
          eq(messageTemplates.isDefault, true),
        ),
      });
    });

    return template;
  } catch (error) {
    console.error("Error fetching WhatsApp template:", error);
    throw new Error("Failed to fetch WhatsApp template");
  }
}

/**
 * Log a WhatsApp message attempt
 * MVP: Just logs the message, doesn't actually send via API
 */
export async function logWhatsAppMessage(
  leadId: string,
  renderedMessage: string,
  templateId?: string,
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    await dbClient.rls(async (tx) => {
      // Log message in messages table
      await tx.insert(messages).values({
        leadId,
        templateId: templateId || null,
        channel: "whatsapp",
        content: renderedMessage,
        status: "sent", // MVP: assume sent immediately
        sentAt: new Date(),
        sentById: session.user.id,
      });

      // Log activity
      await tx.insert(leadNotes).values({
        leadId,
        content: `Message WhatsApp envoyé`,
        createdById: session.user.id,
      });
    });

    revalidatePath(`/leads/${leadId}`);

    return { success: true };
  } catch (error) {
    console.error("Error logging WhatsApp message:", error);
    throw new Error("Failed to log WhatsApp message");
  }
}
