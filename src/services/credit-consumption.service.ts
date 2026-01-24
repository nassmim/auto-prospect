/**
 * Credit Consumption Service
 * Handles atomic credit consumption and transaction logging for hunt channels
 * Runs in admin mode (bypasses RLS) as it's called from background jobs
 */

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import {
  creditTransactions,
  huntChannelCredits,
  TCreditTransaction,
} from "@/schema/credits.schema";
import { hunts } from "@/schema/hunt.schema";
import { ECreditType, ETransactionType } from "@/constants/enums";
import { eq, and, sql } from "drizzle-orm";

export type ConsumeCreditsParams = {
  huntId: string;
  channel: ECreditType;
  messageId?: string;
  recipient?: string;
};

export type ConsumeCreditsResult =
  | { success: true; transaction: TCreditTransaction }
  | { success: false; error: string };

/**
 * Consumes one credit for a successful message send
 * Uses database transaction with row-level locking to prevent race conditions
 */
export async function consumeCredit({
  huntId,
  channel,
  messageId,
  recipient,
}: ConsumeCreditsParams): Promise<ConsumeCreditsResult> {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Use admin mode for background job operations
    const result = await dbClient.admin.transaction(async (tx) => {
      // Lock the hunt channel credits row to prevent concurrent modifications
      const [channelCredit] = await tx
        .select()
        .from(huntChannelCredits)
        .where(
          and(
            eq(huntChannelCredits.huntId, huntId),
            eq(huntChannelCredits.channel, channel),
          ),
        )
        .for("update"); // Row-level lock

      // Error handling: No credits configured for this channel
      if (!channelCredit) {
        throw new Error(
          `No credits configured for channel ${channel} on hunt ${huntId}`,
        );
      }

      // Calculate remaining credits
      const remainingCredits =
        channelCredit.creditsAllocated - channelCredit.creditsConsumed;

      // Error handling: Insufficient credits
      if (remainingCredits <= 0) {
        throw new Error(
          `Insufficient credits for channel ${channel}. Allocated: ${channelCredit.creditsAllocated}, Consumed: ${channelCredit.creditsConsumed}`,
        );
      }

      // Increment consumed credits
      await tx
        .update(huntChannelCredits)
        .set({
          creditsConsumed: sql`${huntChannelCredits.creditsConsumed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(huntChannelCredits.id, channelCredit.id));

      // Get hunt organization ID for transaction logging
      const [hunt] = await tx
        .select({ organizationId: hunts.organizationId })
        .from(hunts)
        .where(eq(hunts.id, huntId));

      if (!hunt) {
        throw new Error(`Hunt not found: ${huntId}`);
      }

      // Create transaction log entry
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          organizationId: hunt.organizationId,
          type: ETransactionType.USAGE,
          creditType: channel,
          amount: -1, // Negative for consumption
          balanceAfter: remainingCredits - 1,
          referenceId: messageId ? messageId : undefined,
          metadata: {
            messageId,
            recipient,
          },
        })
        .returning();

      return transaction;
    });

    return { success: true, transaction: result };
  } catch (error) {
    // Return structured error for graceful handling
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Gets remaining credits for a specific hunt channel
 */
export async function getRemainingCredits(
  huntId: string,
  channel: ECreditType,
): Promise<number | null> {
  const dbClient = await createDrizzleSupabaseClient();

  const [channelCredit] = await dbClient.admin
    .select({
      allocated: huntChannelCredits.creditsAllocated,
      consumed: huntChannelCredits.creditsConsumed,
    })
    .from(huntChannelCredits)
    .where(
      and(
        eq(huntChannelCredits.huntId, huntId),
        eq(huntChannelCredits.channel, channel),
      ),
    );

  if (!channelCredit) {
    return null;
  }

  return channelCredit.allocated - channelCredit.consumed;
}

/**
 * Gets all channel credits for a hunt
 */
export async function getHuntChannelCredits(huntId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  const credits = await dbClient.admin
    .select()
    .from(huntChannelCredits)
    .where(eq(huntChannelCredits.huntId, huntId));

  return credits.map((credit) => ({
    channel: credit.channel,
    allocated: credit.creditsAllocated,
    consumed: credit.creditsConsumed,
    remaining: credit.creditsAllocated - credit.creditsConsumed,
  }));
}
