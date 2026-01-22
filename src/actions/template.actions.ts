"use server";

import { revalidatePath } from "next/cache";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import {
  messageTemplates,
  type MessageTemplateType,
  type MessageChannel,
} from "@/schema/message-template.schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch all templates for the user's organization
 */
export async function getOrganizationTemplates() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's default organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(eq(members.accountId, session.user.id), isNotNull(members.joinedAt)),
        with: {
          organization: {
            columns: {
              id: true,
            },
          },
        },
      });
    });

    if (!member) {
      throw new Error("No organization found");
    }

    // Fetch all templates for this organization
    const templates = await dbClient.rls(async (tx) => {
      return tx.query.messageTemplates.findMany({
        where: eq(messageTemplates.organizationId, member.organization.id),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: (templates, { desc }) => [desc(templates.createdAt)],
      });
    });

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to fetch templates");
  }
}

/**
 * Create a new text template
 */
export async function createTextTemplate(data: {
  name: string;
  channel: MessageChannel;
  content: string;
  isDefault?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!data.name.trim() || !data.content.trim()) {
    throw new Error("Name and content are required");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(eq(members.accountId, session.user.id), isNotNull(members.joinedAt)),
        with: {
          organization: {
            columns: {
              id: true,
            },
          },
        },
      });
    });

    if (!member) {
      throw new Error("No organization found");
    }

    // If setting as default, unset other defaults for this channel
    if (data.isDefault) {
      await dbClient.rls(async (tx) => {
        await tx
          .update(messageTemplates)
          .set({ isDefault: false })
          .where(
            (table, { and, eq }) =>
              and(
                eq(table.organizationId, member.organization.id),
                eq(table.channel, data.channel),
                eq(table.type, "text"),
              ),
          );
      });
    }

    // Create template
    const [template] = await dbClient.rls(async (tx) => {
      return tx
        .insert(messageTemplates)
        .values({
          organizationId: member.organization.id,
          name: data.name.trim(),
          type: "text",
          channel: data.channel,
          content: data.content.trim(),
          isDefault: data.isDefault || false,
          createdById: session.user.id,
        })
        .returning();
    });

    revalidatePath("/templates");

    return { success: true, template };
  } catch (error) {
    console.error("Error creating text template:", error);
    throw new Error("Failed to create template");
  }
}

/**
 * Create a new voice template
 */
export async function createVoiceTemplate(data: {
  name: string;
  audioUrl: string;
  audioDuration: number;
  isDefault?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!data.name.trim() || !data.audioUrl) {
    throw new Error("Name and audio file are required");
  }

  if (data.audioDuration < 15 || data.audioDuration > 55) {
    throw new Error("Audio duration must be between 15 and 55 seconds");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(eq(members.accountId, session.user.id), isNotNull(members.joinedAt)),
        with: {
          organization: {
            columns: {
              id: true,
            },
          },
        },
      });
    });

    if (!member) {
      throw new Error("No organization found");
    }

    // If setting as default, unset other voice defaults
    if (data.isDefault) {
      await dbClient.rls(async (tx) => {
        await tx
          .update(messageTemplates)
          .set({ isDefault: false })
          .where(
            (table, { and, eq }) =>
              and(
                eq(table.organizationId, member.organization.id),
                eq(table.type, "voice"),
              ),
          );
      });
    }

    // Create template
    const [template] = await dbClient.rls(async (tx) => {
      return tx
        .insert(messageTemplates)
        .values({
          organizationId: member.organization.id,
          name: data.name.trim(),
          type: "voice",
          channel: null,
          audioUrl: data.audioUrl,
          audioDuration: data.audioDuration,
          isDefault: data.isDefault || false,
          createdById: session.user.id,
        })
        .returning();
    });

    revalidatePath("/templates");

    return { success: true, template };
  } catch (error) {
    console.error("Error creating voice template:", error);
    throw new Error("Failed to create template");
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string) {
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
      await tx.delete(messageTemplates).where(eq(messageTemplates.id, templateId));
    });

    revalidatePath("/templates");

    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    throw new Error("Failed to delete template");
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    content?: string;
    isDefault?: boolean;
  },
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
    const updates: {
      name?: string;
      content?: string;
      isDefault?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.content !== undefined) updates.content = data.content.trim();
    if (data.isDefault !== undefined) {
      updates.isDefault = data.isDefault;

      // If setting as default, get template to unset others of same type/channel
      if (data.isDefault) {
        const template = await dbClient.rls(async (tx) => {
          return tx.query.messageTemplates.findFirst({
            where: eq(messageTemplates.id, templateId),
          });
        });

        if (template) {
          await dbClient.rls(async (tx) => {
            const conditions = [
              (table: typeof messageTemplates, { eq, and }: any) =>
                and(
                  eq(table.organizationId, template.organizationId),
                  eq(table.type, template.type),
                ),
            ];

            if (template.channel) {
              conditions.push((table: typeof messageTemplates, { eq }: any) =>
                eq(table.channel, template.channel),
              );
            }

            await tx
              .update(messageTemplates)
              .set({ isDefault: false })
              .where((table, { and }) => and(...conditions.map((c) => c(table, { eq, and }))));
          });
        }
      }
    }

    await dbClient.rls(async (tx) => {
      await tx.update(messageTemplates).set(updates).where(eq(messageTemplates.id, templateId));
    });

    revalidatePath("/templates");

    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}
