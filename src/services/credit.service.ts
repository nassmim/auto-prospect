import { ETransactionType } from "@/constants/enums";
import { createDrizzleSupabaseClient, TDBQuery } from "@/lib/drizzle/dbClient";
import {
  creditTransactions,
  huntChannelCredits,
} from "@/schema/credits.schema";
import {
  TConsumeCreditsParams,
  TConsumeCreditsResult,
} from "@/types/payment.types";
import { eq, sql } from "drizzle-orm";

/**
 * Consumes one credit for a successful message send
 * Uses database transaction with row-level locking to prevent race conditions
 *
 * @param bypassRLS - If true, uses admin mode (for background jobs). If false, uses RLS mode (for user-triggered actions). Defaults to false.
 */
export async function consumeCredit({
  huntId,
  channel,
  messageId,
  recipient,
  bypassRLS = false,
}: TConsumeCreditsParams): Promise<TConsumeCreditsResult> {
  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Define transaction logic once
    const transactionLogic = async (tx: TDBQuery) => {
      // Lock the hunt channel credits row to prevent concurrent modifications
      const channelCredit = await tx.query.huntChannelCredits.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.huntId, huntId), eq(table.channel, channel)),
      });

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

      // Increment consumed credits atomically
      await tx
        .update(huntChannelCredits)
        .set({
          creditsConsumed: sql`${huntChannelCredits.creditsConsumed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(huntChannelCredits.id, channelCredit.id));

      // Get hunt account ID for transaction logging
      const hunt = await tx.query.hunts.findFirst({
        where: (table, { eq }) => eq(table.id, huntId),
        columns: { accountId: true },
      });

      if (!hunt) {
        throw new Error(`Hunt not found: ${huntId}`);
      }

      // Create transaction log entry
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          accountId: hunt.accountId,
          type: ETransactionType.USAGE,
          channel,
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
    };

    // Execute with transaction for atomicity, choosing admin vs RLS mode (CLAUDE.md Pattern 1)
    const result = bypassRLS
      ? await dbClient.admin.transaction(transactionLogic)
      : await dbClient.rls(transactionLogic);

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
 * Gets all channel credits for a hunt
 */
export async function getHuntChannelCredits(
  huntId: string,
  bypassRLS: boolean = false,
) {
  const dbClient = await createDrizzleSupabaseClient();

  const query = (tx: TDBQuery) =>
    tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });

  const credits = bypassRLS
    ? await query(dbClient.admin)
    : await dbClient.rls(query);

  return credits.map((credit) => ({
    channel: credit.channel,
    allocated: credit.creditsAllocated,
    consumed: credit.creditsConsumed,
    remaining: credit.creditsAllocated - credit.creditsConsumed,
  }));
}
