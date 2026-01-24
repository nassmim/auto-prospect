"use server";

import { EHuntStatus } from "@/constants/enums";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validation";
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
 * Fetches a single hunt by ID
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

  return hunt;
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
 * Updates hunt details
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
    return tx
      .update(hunts)
      .set(validatedData)
      .where(eq(hunts.id, huntId))
      .returning();
  });

  return updatedHunt;
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
