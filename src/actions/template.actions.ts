"use server";

import {
  createDrizzleSupabaseClient,
  TANDperator,
} from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validation";
import { messageTemplates } from "@/schema/message-template.schema";
import { textTemplateSchema, voiceTemplateSchema } from "@/validation-schemas";
import { and, BinaryOperator, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Fetch all templates for the user's organization
 */
export async function getOrganizationTemplates() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Non autorisé");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's default organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(
            eq(members.organizationId, session.user.id),
            isNotNull(members.joinedAt),
          ),
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
      throw new Error("Aucune organisation trouvée");
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
export async function createTextTemplate(data: unknown) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Validate with Zod
  const parseResult = textTemplateSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(
            eq(members.organizationId, session.user.id),
            isNotNull(members.joinedAt),
          ),
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
      throw new Error("Aucune organisation trouvée");
    }

    // If setting as default, unset other defaults for this channel
    if (validatedData.isDefault) {
      await dbClient.rls((tx) =>
        tx
          .update(messageTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(messageTemplates.organizationId, member.organization.id),
              eq(messageTemplates.channel, validatedData.channel),
              eq(messageTemplates.type, "text"),
            ),
          ),
      );
    }

    // Create template
    const [template] = await dbClient.rls(async (tx) => {
      return tx
        .insert(messageTemplates)
        .values({
          organizationId: member.organization.id,
          name: validatedData.name,
          type: "text",
          channel: validatedData.channel,
          content: validatedData.content,
          isDefault: validatedData.isDefault || false,
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
export async function createVoiceTemplate(data: unknown) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Validate with Zod
  const parseResult = voiceTemplateSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Get user's organization
    const member = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (members, { eq, and, isNotNull }) =>
          and(
            eq(members.organizationId, session.user.id),
            isNotNull(members.joinedAt),
          ),
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
      throw new Error("Aucune organisation trouvée");
    }

    // If setting as default, unset other voice defaults
    if (validatedData.isDefault) {
      await dbClient.rls(async (tx) => {
        await tx
          .update(messageTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(messageTemplates.organizationId, member.organization.id),
              eq(messageTemplates.type, "voice"),
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
          name: validatedData.name,
          type: "voice",
          channel: null,
          audioUrl: validatedData.audioUrl,
          audioDuration: validatedData.audioDuration,
          isDefault: validatedData.isDefault || false,
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
    throw new Error("Non autorisé");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    await dbClient.rls(async (tx) => {
      await tx
        .delete(messageTemplates)
        .where(eq(messageTemplates.id, templateId));
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
    throw new Error("Non autorisé");
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
              (
                table: typeof messageTemplates,
                { eq, and }: { eq: BinaryOperator; and: TANDperator },
              ) =>
                and(
                  eq(table.organizationId, template.organizationId),
                  eq(table.type, template.type),
                ),
            ];

            if (template.channel) {
              conditions.push(
                (
                  table: typeof messageTemplates,
                  { eq }: { eq: BinaryOperator },
                ) => eq(table.channel, template.channel!),
              );
            }

            await tx
              .update(messageTemplates)
              .set({ isDefault: false })
              .where(
                and(...conditions.map((c) => c(messageTemplates, { eq, and }))),
              );
          });
        }
      }
    }

    await dbClient.rls(async (tx) => {
      await tx
        .update(messageTemplates)
        .set(updates)
        .where(eq(messageTemplates.id, templateId));
    });

    revalidatePath("/templates");

    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}
