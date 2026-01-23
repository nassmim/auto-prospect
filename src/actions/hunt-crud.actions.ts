"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validation";
import { baseFilters, type HuntStatus } from "@/schema/filter.schema";
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
    return tx.query.baseFilters.findMany({
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
    return tx.query.baseFilters.findFirst({
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
  const [hunt] = await dbClient.rls(async (tx) => {
    return tx
      .insert(baseFilters)
      .values({
        organizationId: memberData.organization_id,
        createdById: userData.user.id,
        name: validatedData.name,
        locationId: validatedData.locationId,
        radiusInKm: validatedData.radiusInKm ?? 0,
        adTypeId: validatedData.adTypeId,
        autoRefresh: validatedData.autoRefresh ?? true,
        outreachSettings: validatedData.outreachSettings ?? {},
        templateIds: validatedData.templateIds ?? {},
        status: "active",
        // Optional filters
        priceMin: validatedData.priceMin ?? 0,
        priceMax: validatedData.priceMax ?? null,
        mileageMin: validatedData.mileageMin ?? 0,
        mileageMax: validatedData.mileageMax ?? null,
        modelYearMin: validatedData.modelYearMin ?? 2010,
        modelYearMax: validatedData.modelYearMax ?? null,
        // Boolean flags
        hasBeenReposted: validatedData.hasBeenReposted ?? false,
        priceHasDropped: validatedData.priceHasDropped ?? false,
        isUrgent: validatedData.isUrgent ?? false,
        hasBeenBoosted: validatedData.hasBeenBoosted ?? false,
        isLowPrice: validatedData.isLowPrice ?? false,
        isActive: true,
      })
      .returning();
  });

  // TODO: Add related filters (brands, subTypes) if provided
  // This would require separate inserts into brandsFilters and adSubTypesFilters tables

  return hunt;
}

/**
 * Updates hunt status (active/paused)
 */
export async function updateHuntStatus(huntId: string, status: HuntStatus) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Non authentifié");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const [updatedHunt] = await dbClient.rls(async (tx) => {
    return tx
      .update(baseFilters)
      .set({ status })
      .where(eq(baseFilters.id, huntId))
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
      .update(baseFilters)
      .set(validatedData)
      .where(eq(baseFilters.id, huntId))
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
    return tx.delete(baseFilters).where(eq(baseFilters.id, huntId));
  });

  return { success: true };
}
