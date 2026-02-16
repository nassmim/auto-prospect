"use server";

import { CACHE_TAGS } from "@/lib/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { formatZodError } from "@/lib/validation";
import { getUserAccount } from "@/services/account.service";
import {
  getAccountHunts,
  getHuntById,
  updateAccountHuntsCache,
} from "@/services/hunt.service";
import { createHuntSchema, updateHuntSchema } from "@/validation-schemas";
import { brandsHunts, eq, hunts, subTypesHunts } from "@auto-prospect/db";
import {
  EHuntStatus,
  THuntStatus,
} from "@auto-prospect/shared/src/config/hunt.config";
import { updateTag } from "next/cache";

/**
 * Fetches all hunts for the current user's account
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchAccountHunts() {
  return getAccountHunts();
}

/**
 * Fetches a single hunt by ID
 * Server action wrapper for SWR client-side fetching
 */
export async function fetchHuntById(huntId: string) {
  return getHuntById(huntId);
}

/**
 * Creates a new hunt
 */
export async function createHunt(data: unknown) {
  // Validate input with Zod
  const parseResult = createHuntSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;

  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });

  // Create the hunt with RLS enforcement
  const hunt = await dbClient.rls(async (tx) => {
    // Insert the main hunt record
    const [newHunt] = await tx
      .insert(hunts)
      .values({
        accountId: account.id,
        name: validatedData.name,
        locationId: validatedData.locationId,
        typeId: validatedData.adTypeId,
        status: EHuntStatus.ACTIVE,
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

    return newHunt;
  });

  updateTag(CACHE_TAGS.huntsByAccount(account.id));

  return hunt;
}

/**
 * Updates hunt status (active/paused)
 */
export async function updateHuntStatus(huntId: string, status: THuntStatus) {
  const dbClient = await createDrizzleSupabaseClient();

  const [updatedHunt] = await dbClient.rls(async (tx) => {
    return tx
      .update(hunts)
      .set({ status })
      .where(eq(hunts.id, huntId))
      .returning();
  });

  await updateAccountHuntsCache(dbClient, huntId);

  return updatedHunt;
}

/**
 * Updates hunt details and channel credits
 */
export async function updateHunt(huntId: string, data: unknown) {
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

  await updateAccountHuntsCache(dbClient, huntId);

  return updatedHunt;
}


/**
 * Deletes a hunt
 */
export async function deleteHunt(huntId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  await dbClient.rls(async (tx) => {
    return tx.delete(hunts).where(eq(hunts.id, huntId));
  });

  await updateAccountHuntsCache(dbClient, huntId);

  return { success: true };
}
