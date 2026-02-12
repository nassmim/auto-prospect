"use server";

import { pages } from "@/config/routes";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { formatZodError } from "@/lib/validation";
import {
  getLeadActivities,
  getLeadAssociatedTeamMembers,
  getLeadDetails,
  getLeadMessages,
  getPipelineLeads,
  updateLeadCache,
} from "@/services/lead.service";
import { leadNoteSchema, leadReminderSchema } from "@/validation-schemas";
import {
  eq,
  inArray,
  leadNotes,
  leadReminders,
  leads,
} from "@auto-prospect/db";
import { TLeadStage } from "@auto-prospect/shared/src/config/lead.config";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../packages/db/src/supabase/server";

/**
 * Fetches complete lead details with all relations
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchLeadDetails(leadId: string) {
  return getLeadDetails(leadId);
}

/**
 * Fetches all members of the lead's account for assignment dropdown
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchLeadTeamMembers(leadId: string) {
  return getLeadAssociatedTeamMembers(leadId);
}

/**
 * Fetches message history for a lead
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchLeadMessages(leadId: string) {
  return getLeadMessages(leadId);
}

/**
 * Fetches activity timeline for a lead
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchLeadActivities(leadId: string) {
  return getLeadActivities(leadId);
}

/**
 * Fetches all leads for the pipeline/kanban view
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchPipelineLeads() {
  return getPipelineLeads();
}

/**
 * Updates a lead's stage and logs the activity
 * Used when dragging leads between Kanban columns
 */
export async function updateLeadStage(leadId: string, newStage: TLeadStage) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // RLS query wrapper - enforces account access
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
      });
    });

    await updateLeadCache(leadId);
    revalidatePath(pages.leads.list);

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
  newStage?: TLeadStage,
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
    const updateData: {
      position: number;
      updatedAt: Date;
      stage?: TLeadStage;
    } = {
      position: newPosition,
      updatedAt: new Date(),
    };

    if (newStage) {
      updateData.stage = newStage;
    }

    await dbClient.rls(async (tx) => {
      await tx.update(leads).set(updateData).where(eq(leads.id, leadId));
    });

    await updateLeadCache(leadId);
    revalidatePath(pages.leads.list);

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
    stage?: TLeadStage;
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
      stage?: TLeadStage;
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
          })),
        );
      }
    });

    await Promise.all(leadIds.map((id) => updateLeadCache(id)));
    revalidatePath(pages.leads.list);

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
        content: userId ? `Lead assigné à un utilisateur` : `Lead non assigné`,
      });
    });

    await updateLeadCache(leadId);
    revalidatePath(pages.leads.list);

    return { success: true };
  } catch (error) {
    console.error("Error assigning lead:", error);
    throw new Error("Failed to assign lead");
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

  try {
    const note = await dbClient.rls(async (tx) => {
      const [newNote] = await tx
        .insert(leadNotes)
        .values({
          leadId,
          content: validatedContent.trim(),
        })
        .returning();

      return newNote;
    });

    await updateLeadCache(leadId);
    revalidatePath(pages.leads.detail(leadId));

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

  try {
    const reminder = await dbClient.rls(async (tx) => {
      const [newReminder] = await tx
        .insert(leadReminders)
        .values({
          leadId,
          dueAt: validatedDueAt,
          note: validatedNote?.trim() || null,
        })
        .returning();

      return newReminder;
    });

    await updateLeadCache(leadId);
    revalidatePath(pages.leads.detail(leadId));

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
    // First, get the reminder to find its leadId
    const reminder = await dbClient.rls(async (tx) => {
      return tx.query.leadReminders.findFirst({
        where: eq(leadReminders.id, reminderId),
        columns: {
          leadId: true,
        },
      });
    });

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    await dbClient.rls(async (tx) => {
      await tx.delete(leadReminders).where(eq(leadReminders.id, reminderId));
    });

    await updateLeadCache(reminder.leadId);
    revalidatePath(pages.leads.list);

    return { success: true };
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw new Error("Failed to delete reminder");
  }
}
