"use server";

import { getUserPersonalOrganizationId } from "@/actions/organization.actions";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validation";
import {
  leadNotes,
  leadReminders,
  leads,
  type LeadStage,
} from "@/schema/lead.schema";
import { messageTemplates } from "@/schema/message-template.schema";
import { leadActivities, messages } from "@/schema/message.schema";
import { organizationMembers } from "@/schema/organization.schema";
import { leadNoteSchema, leadReminderSchema } from "@/validation-schemas";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

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
        createdById: userOrgId,
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
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

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
        noteContent.push(`Assigné à: ${updates.assignedToId || "Non assigné"}`);

      if (noteContent.length > 0) {
        await tx.insert(leadNotes).values(
          leadIds.map((leadId) => ({
            leadId,
            content: `Action groupée - ${noteContent.join(", ")}`,
            createdById: userOrgId,
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
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

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
        content: userId ? `Lead assigné à un utilisateur` : `Lead non assigné`,
        createdById: userOrgId,
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
          memberOrganization: {
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

    return members.map((m) => m.memberOrganization);
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
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

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
        sentById: userOrgId,
      });

      // Log activity
      await tx.insert(leadNotes).values({
        leadId,
        content: `Message WhatsApp envoyé`,
        createdById: userOrgId,
      });
    });

    revalidatePath(`/leads/${leadId}`);

    return { success: true };
  } catch (error) {
    console.error("Error logging WhatsApp message:", error);
    throw new Error("Failed to log WhatsApp message");
  }
}

/**
 * Add a note to a lead
 */
export async function addLeadNote(leadId: string, content: unknown) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validate content with Zod
  const parseResult = leadNoteSchema.safeParse({ content });
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedContent = parseResult.data.content;

  const dbClient = await createDrizzleSupabaseClient();
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

  try {
    const note = await dbClient.rls(async (tx) => {
      const [newNote] = await tx
        .insert(leadNotes)
        .values({
          leadId,
          content: validatedContent.trim(),
          createdById: userOrgId,
        })
        .returning();

      return newNote;
    });

    revalidatePath(`/leads/${leadId}`);

    return { success: true, note };
  } catch (error) {
    console.error("Error adding lead note:", error);
    throw new Error("Failed to add note");
  }
}

/**
 * Add a reminder for a lead
 */
export async function addLeadReminder(
  leadId: string,
  dueAt: unknown,
  note?: unknown,
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validate reminder data with Zod
  const parseResult = leadReminderSchema.safeParse({ dueAt, note });
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const { dueAt: validatedDueAt, note: validatedNote } = parseResult.data;

  const dbClient = await createDrizzleSupabaseClient();
  const userOrgId = await getUserPersonalOrganizationId(session.user.id);

  try {
    const reminder = await dbClient.rls(async (tx) => {
      const [newReminder] = await tx
        .insert(leadReminders)
        .values({
          leadId,
          dueAt: validatedDueAt,
          note: validatedNote?.trim() || null,
          createdById: userOrgId,
        })
        .returning();

      return newReminder;
    });

    revalidatePath(`/leads/${leadId}`);

    return { success: true, reminder };
  } catch (error) {
    console.error("Error adding lead reminder:", error);
    throw new Error("Failed to add reminder");
  }
}

/**
 * Delete a reminder
 */
export async function deleteLeadReminder(reminderId: string) {
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
      await tx.delete(leadReminders).where(eq(leadReminders.id, reminderId));
    });

    revalidatePath("/leads");

    return { success: true };
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw new Error("Failed to delete reminder");
  }
}

/**
 * Fetch message history for a lead
 */
export async function getLeadMessages(leadId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

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
        orderBy: [desc(messages.sentAt)],
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
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const activitiesList = await dbClient.rls(async (tx) => {
      return tx.query.leadActivities.findMany({
        where: eq(leadActivities.leadId, leadId),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(leadActivities.createdAt)],
      });
    });

    return activitiesList;
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    throw new Error("Failed to fetch activities");
  }
}
