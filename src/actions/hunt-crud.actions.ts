"use server";

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { baseFilters, type HuntStatus, type OutreachSettings, type TemplateIds } from "@/schema/filter.schema";
import { eq } from "drizzle-orm";

/**
 * Fetches all hunts for the current user's organization
 */
export async function getOrganizationHunts() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Not authenticated");
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
    throw new Error("Not authenticated");
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
    throw new Error("Hunt not found");
  }

  return hunt;
}

/**
 * Creates a new hunt
 */
export async function createHunt(data: {
  name: string;
  locationId: number;
  radiusInKm?: number;
  adTypeId: number;
  autoRefresh?: boolean;
  outreachSettings?: OutreachSettings;
  templateIds?: TemplateIds;
  // Optional filter fields
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  modelYearMin?: number;
  modelYearMax?: number;
  // Boolean flags
  hasBeenReposted?: boolean;
  priceHasDropped?: boolean;
  isUrgent?: boolean;
  hasBeenBoosted?: boolean;
  isLowPrice?: boolean;
  // Related filters
  brandIds?: number[];
  subTypeIds?: number[];
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Not authenticated");
  }

  // Get user's organization
  const { data: memberData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("account_id", userData.user.id)
    .single();

  if (!memberData) {
    throw new Error("User is not a member of any organization");
  }

  const dbClient = await createDrizzleSupabaseClient();

  // Create the hunt with RLS enforcement
  const [hunt] = await dbClient.rls(async (tx) => {
    return tx
      .insert(baseFilters)
      .values({
        organizationId: memberData.organization_id,
        createdById: userData.user.id,
        name: data.name,
        locationId: data.locationId,
        radiusInKm: data.radiusInKm ?? 0,
        adTypeId: data.adTypeId,
        autoRefresh: data.autoRefresh ?? true,
        outreachSettings: data.outreachSettings ?? {},
        templateIds: data.templateIds ?? {},
        status: "active",
        // Optional filters
        priceMin: data.priceMin ?? 0,
        priceMax: data.priceMax ?? null,
        mileageMin: data.mileageMin ?? 0,
        mileageMax: data.mileageMax ?? null,
        modelYearMin: data.modelYearMin ?? 2010,
        modelYearMax: data.modelYearMax ?? null,
        // Boolean flags
        hasBeenReposted: data.hasBeenReposted ?? false,
        priceHasDropped: data.priceHasDropped ?? false,
        isUrgent: data.isUrgent ?? false,
        hasBeenBoosted: data.hasBeenBoosted ?? false,
        isLowPrice: data.isLowPrice ?? false,
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
    throw new Error("Not authenticated");
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
export async function updateHunt(
  huntId: string,
  data: {
    name?: string;
    autoRefresh?: boolean;
    outreachSettings?: OutreachSettings;
    templateIds?: TemplateIds;
    locationId?: number;
    radiusInKm?: number;
    // Optional filter fields
    priceMin?: number;
    priceMax?: number;
    mileageMin?: number;
    mileageMax?: number;
    modelYearMin?: number;
    modelYearMax?: number;
    // Boolean flags
    hasBeenReposted?: boolean;
    priceHasDropped?: boolean;
    isUrgent?: boolean;
    hasBeenBoosted?: boolean;
    isLowPrice?: boolean;
  },
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Not authenticated");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const [updatedHunt] = await dbClient.rls(async (tx) => {
    return tx
      .update(baseFilters)
      .set(data)
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
    throw new Error("Not authenticated");
  }

  const dbClient = await createDrizzleSupabaseClient();

  await dbClient.rls(async (tx) => {
    return tx.delete(baseFilters).where(eq(baseFilters.id, huntId));
  });

  return { success: true };
}
