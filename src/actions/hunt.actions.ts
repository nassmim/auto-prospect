"use server";

import { ECreditType, EHuntStatus } from "@/constants/enums";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validation";
import { huntChannelCredits } from "@/schema/credits.schema";
import { brandsHunts, hunts, subTypesHunts } from "@/schema/hunt.schema";
import { createHuntSchema, updateHuntSchema } from "@/validation-schemas";
import { eq } from "drizzle-orm";

/**
 * Fetches all hunts for the current user's organization
 */
export async function getOrganizationHunts() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  // Use RLS wrapper to ensure user can only see their organization's hunts
  const hunts = await dbClient.rls(async (tx) => {
    return tx.query.hunts.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        location: true,
        brands: {
          with: {
            brand: true,
          },
        },
        subTypes: {
          with: {
            subType: true,
          },
        },
      },
    });
  });

  return hunts;
}

/**
 * Fetches a single hunt by ID with channel credits
 */
export async function getHuntById(huntId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const hunt = await dbClient.rls(async (tx) => {
    return tx.query.hunts.findFirst({
      where: (table, { eq }) => eq(table.id, huntId),
      with: {
        location: true,
        brands: {
          with: {
            brand: true,
          },
        },
        subTypes: {
          with: {
            subType: true,
          },
        },
      },
    });
  });

  if (!hunt) {
    throw new Error("Recherche introuvable");
  }

  // Fetch channel credits separately
  const channelCreditsData = await dbClient.rls(async (tx) => {
    return tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });
  });

  return {
    ...hunt,
    channelCredits: channelCreditsData,
  };
}

/**
 * Creates a new hunt
 */
export async function createHunt(data: unknown) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  // Validate input with Zod
  const parseResult = createHuntSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;

  // Get user's organization
  const { data: memberData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("account_id", userData.user.id)
    .single();

  if (!memberData) {
    throw new Error("L'utilisateur n'est membre d'aucune organisation");
  }

  const dbClient = await createDrizzleSupabaseClient();

  // Create the hunt with RLS enforcement
  const hunt = await dbClient.rls(async (tx) => {
    // Insert the main hunt record
    const [newHunt] = await tx
      .insert(hunts)
      .values({
        organizationId: memberData.organization_id,
        name: validatedData.name,
        locationId: validatedData.locationId,
        typeId: validatedData.adTypeId,
        status: "active",
        radiusInKm: validatedData.radiusInKm,
        dailyPacingLimit: validatedData.dailyPacingLimit,
        autoRefresh: validatedData.autoRefresh,
        outreachSettings: validatedData.outreachSettings,
        templateIds: validatedData.templateIds,
        priceMin: validatedData.priceMin,
        priceMax: validatedData.priceMax,
        mileageMin: validatedData.mileageMin,
        mileageMax: validatedData.mileageMax,
        modelYearMin: validatedData.modelYearMin,
        modelYearMax: validatedData.modelYearMax,
        hasBeenReposted: validatedData.hasBeenReposted,
        priceHasDropped: validatedData.priceHasDropped,
        isUrgent: validatedData.isUrgent,
        hasBeenBoosted: validatedData.hasBeenBoosted,
        isLowPrice: validatedData.isLowPrice,
      })
      .returning();

    // Insert brand filters if provided
    if (validatedData.brandIds?.length) {
      await tx.insert(brandsHunts).values(
        validatedData.brandIds.map((brandId) => ({
          huntId: newHunt.id,
          brandId,
        })),
      );
    }

    // Insert subType filters if provided
    if (validatedData.subTypeIds?.length) {
      await tx.insert(subTypesHunts).values(
        validatedData.subTypeIds.map((subTypeId) => ({
          huntId: newHunt.id,
          subTypeId,
        })),
      );
    }

    // Insert channel credit allocations for enabled channels
    const channelCreditsToInsert = [];

    if (validatedData.channelCredits?.sms && validatedData.channelCredits.sms > 0) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: ECreditType.SMS,
        creditsAllocated: validatedData.channelCredits.sms,
        creditsConsumed: 0,
      });
    }

    if (validatedData.channelCredits?.whatsapp && validatedData.channelCredits.whatsapp > 0) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: ECreditType.WHATSAPP_TEXT,
        creditsAllocated: validatedData.channelCredits.whatsapp,
        creditsConsumed: 0,
      });
    }

    if (validatedData.channelCredits?.ringlessVoice && validatedData.channelCredits.ringlessVoice > 0) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: ECreditType.RINGLESS_VOICE,
        creditsAllocated: validatedData.channelCredits.ringlessVoice,
        creditsConsumed: 0,
      });
    }

    if (channelCreditsToInsert.length > 0) {
      await tx.insert(huntChannelCredits).values(channelCreditsToInsert);
    }

    return newHunt;
  });

  return hunt;
}

/**
 * Updates hunt status (active/paused)
 */
export async function updateHuntStatus(huntId: string, status: EHuntStatus) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const [updatedHunt] = await dbClient.rls(async (tx) => {
    return tx
      .update(hunts)
      .set({ status })
      .where(eq(hunts.id, huntId))
      .returning();
  });

  return updatedHunt;
}

/**
 * Updates hunt details and channel credits
 */
export async function updateHunt(huntId: string, data: unknown) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  // Validate input with Zod
  const parseResult = updateHuntSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;

  const dbClient = await createDrizzleSupabaseClient();

  const [updatedHunt] = await dbClient.rls(async (tx) => {
    const result = await tx
      .update(hunts)
      .set(validatedData)
      .where(eq(hunts.id, huntId))
      .returning();

    return result;
  });

  return updatedHunt;
}

/**
 * Updates or creates hunt channel credit allocations
 */
export async function updateHuntChannelCredits(
  huntId: string,
  channelCredits: {
    sms?: number;
    whatsapp?: number;
    ringlessVoice?: number;
  }
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  await dbClient.rls(async (tx) => {
    // Handle SMS credits
    if (channelCredits.sms !== undefined) {
      if (channelCredits.sms > 0) {
        // Upsert: try to update, if not exists insert
        const existing = await tx.query.huntChannelCredits.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.huntId, huntId),
              eq(table.channel, ECreditType.SMS)
            ),
        });

        if (existing) {
          await tx
            .update(huntChannelCredits)
            .set({ creditsAllocated: channelCredits.sms })
            .where(eq(huntChannelCredits.id, existing.id));
        } else {
          await tx.insert(huntChannelCredits).values({
            huntId,
            channel: ECreditType.SMS,
            creditsAllocated: channelCredits.sms,
            creditsConsumed: 0,
          });
        }
      }
    }

    // Handle WhatsApp credits
    if (channelCredits.whatsapp !== undefined) {
      if (channelCredits.whatsapp > 0) {
        const existing = await tx.query.huntChannelCredits.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.huntId, huntId),
              eq(table.channel, ECreditType.WHATSAPP_TEXT)
            ),
        });

        if (existing) {
          await tx
            .update(huntChannelCredits)
            .set({ creditsAllocated: channelCredits.whatsapp })
            .where(eq(huntChannelCredits.id, existing.id));
        } else {
          await tx.insert(huntChannelCredits).values({
            huntId,
            channel: ECreditType.WHATSAPP_TEXT,
            creditsAllocated: channelCredits.whatsapp,
            creditsConsumed: 0,
          });
        }
      }
    }

    // Handle Ringless Voice credits
    if (channelCredits.ringlessVoice !== undefined) {
      if (channelCredits.ringlessVoice > 0) {
        const existing = await tx.query.huntChannelCredits.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.huntId, huntId),
              eq(table.channel, ECreditType.RINGLESS_VOICE)
            ),
        });

        if (existing) {
          await tx
            .update(huntChannelCredits)
            .set({ creditsAllocated: channelCredits.ringlessVoice })
            .where(eq(huntChannelCredits.id, existing.id));
        } else {
          await tx.insert(huntChannelCredits).values({
            huntId,
            channel: ECreditType.RINGLESS_VOICE,
            creditsAllocated: channelCredits.ringlessVoice,
            creditsConsumed: 0,
          });
        }
      }
    }
  });

  return { success: true };
}

/**
 * Deletes a hunt
 */
export async function deleteHunt(huntId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  await dbClient.rls(async (tx) => {
    return tx.delete(hunts).where(eq(hunts.id, huntId));
  });

  return { success: true };
}
