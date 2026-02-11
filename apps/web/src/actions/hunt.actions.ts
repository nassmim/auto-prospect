"use server";

import { CACHE_TAGS } from "@/lib/cache/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { formatZodError } from "@/lib/validation";
import { huntChannelCredits } from "@/schema/credits.schema";
import { brandsHunts, hunts, subTypesHunts } from "@/schema/hunt.schema";
import { getUserAccount } from "@/services/account.service";
import {
  getAccountHunts,
  getHuntById,
  updateAccountHuntsCache,
} from "@/services/hunt.service";
import { createHuntSchema, updateHuntSchema } from "@/validation-schemas";
import {
  EHuntStatus,
  THuntStatus,
} from "@auto-prospect/shared/src/config/hunt.config";
import {
  EContactChannel,
  WHATSAPP_DAILY_LIMIT,
} from "@auto-prospect/shared/src/config/message.config";
import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { createClient } from "../../../../packages/db/src/supabase/server";

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

    // Insert channel credit allocations for enabled channels
    const channelCreditsToInsert = [];

    if (
      validatedData.channelCredits?.sms &&
      validatedData.channelCredits.sms > 0
    ) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: EContactChannel.SMS,
        creditsAllocated: validatedData.channelCredits.sms,
        creditsConsumed: 0,
      });
    }

    // WhatsApp: auto-allocate daily limit (unlimited for users, hard limit to prevent abuse)
    if (validatedData.outreachSettings?.whatsapp) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: EContactChannel.WHATSAPP_TEXT,
        creditsAllocated: WHATSAPP_DAILY_LIMIT,
        creditsConsumed: 0,
      });
    }

    if (
      validatedData.channelCredits?.ringlessVoice &&
      validatedData.channelCredits.ringlessVoice > 0
    ) {
      channelCreditsToInsert.push({
        huntId: newHunt.id,
        channel: EContactChannel.RINGLESS_VOICE,
        creditsAllocated: validatedData.channelCredits.ringlessVoice,
        creditsConsumed: 0,
      });
    }

    if (channelCreditsToInsert.length > 0) {
      await tx.insert(huntChannelCredits).values(channelCreditsToInsert);
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
 * Updates or creates hunt channel credit allocations
 */
export async function updateHuntChannelCredits(
  huntId: string,
  channelCredits: {
    sms?: number;
    whatsapp?: number;
    ringlessVoice?: number;
  },
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
              eq(table.channel, EContactChannel.SMS),
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
            channel: EContactChannel.SMS,
            creditsAllocated: channelCredits.sms,
            creditsConsumed: 0,
          });
        }
      }
    }

    // Handle WhatsApp credits - always set to daily limit (unlimited for users)
    // Note: This function may not be called for WhatsApp anymore since it's auto-allocated
    // Keeping this for backward compatibility and manual adjustments if needed
    if (channelCredits.whatsapp !== undefined) {
      const creditsToAllocate = WHATSAPP_DAILY_LIMIT; // Always use hard-coded limit

      const existing = await tx.query.huntChannelCredits.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.huntId, huntId),
            eq(table.channel, EContactChannel.WHATSAPP_TEXT),
          ),
      });

      if (existing) {
        await tx
          .update(huntChannelCredits)
          .set({ creditsAllocated: creditsToAllocate })
          .where(eq(huntChannelCredits.id, existing.id));
      } else {
        await tx.insert(huntChannelCredits).values({
          huntId,
          channel: EContactChannel.WHATSAPP_TEXT,
          creditsAllocated: creditsToAllocate,
          creditsConsumed: 0,
        });
      }
    }

    // Handle Ringless Voice credits
    if (channelCredits.ringlessVoice !== undefined) {
      if (channelCredits.ringlessVoice > 0) {
        const existing = await tx.query.huntChannelCredits.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.huntId, huntId),
              eq(table.channel, EContactChannel.RINGLESS_VOICE),
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
            channel: EContactChannel.RINGLESS_VOICE,
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
  const dbClient = await createDrizzleSupabaseClient();

  await dbClient.rls(async (tx) => {
    return tx.delete(hunts).where(eq(hunts.id, huntId));
  });

  await updateAccountHuntsCache(dbClient, huntId);

  return { success: true };
}
