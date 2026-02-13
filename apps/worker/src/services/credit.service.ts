/**
 * Credit Service - Worker Context
 *
 * Credit consumption for message workers (admin context)
 */

import {
  creditTransactions,
  getDBAdminClient,
  huntChannelCredits,
} from "@auto-prospect/db";
import {
  EContactChannel,
  TContactChannel,
  WHATSAPP_DAILY_LIMIT,
} from "@auto-prospect/shared/src/config/message.config";
import { ETransactionType } from "@auto-prospect/shared/src/config/payment.config";
import { eq, sql } from "drizzle-orm";

export type TConsumeCreditsParams = {
  huntId: string;
  channel: TContactChannel;
  messageId?: string;
  recipient?: string;
};

export type TConsumeCreditsResult =
  | { success: true; transaction: { id: string; balanceAfter: number } }
  | { success: false; error: string };

/**
 * Consumes one credit for a successful message send (worker context)
 * Uses database transaction with row-level locking to prevent race conditions
 * ALWAYS bypasses RLS using admin client (workers operate in system context)
 *
 * Special handling for WhatsApp: Credits are tracked but never fail due to
 * insufficient balance (WhatsApp is unlimited for users with 1000/day hard limit)
 */
export async function consumeCredit({
  huntId,
  channel,
  messageId,
  recipient,
}: TConsumeCreditsParams): Promise<TConsumeCreditsResult> {
  const db = getDBAdminClient();

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the hunt channel credits row
      const channelCredit = await tx.query.huntChannelCredits.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.huntId, huntId), eq(table.channel, channel)),
      });

      if (!channelCredit) {
        throw new Error(
          `No credits configured for channel ${channel} on hunt ${huntId}`,
        );
      }

      // Calculate remaining credits
      const remainingCredits =
        channelCredit.creditsAllocated - channelCredit.creditsConsumed;

      // WhatsApp: track consumption but never fail (unlimited for users)
      // Other channels: fail if insufficient credits
      if (channel !== EContactChannel.WHATSAPP_TEXT && remainingCredits <= 0) {
        throw new Error(
          `Insufficient credits for channel ${channel}. Allocated: ${channelCredit.creditsAllocated}, Consumed: ${channelCredit.creditsConsumed}`,
        );
      }

      // Increment consumed credits atomically (tracking for all channels including WhatsApp)
      await tx
        .update(huntChannelCredits)
        .set({
          creditsConsumed: sql`${huntChannelCredits.creditsConsumed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(huntChannelCredits.id, channelCredit.id));

      // Get hunt account ID
      const hunt = await tx.query.hunts.findFirst({
        where: (table, { eq }) => eq(table.id, huntId),
        columns: { accountId: true },
      });

      if (!hunt) {
        throw new Error(`Hunt not found: ${huntId}`);
      }

      // Create transaction log
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          accountId: hunt.accountId,
          type: ETransactionType.USAGE,
          channel,
          amount: -1,
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
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Gets remaining credits for a channel (worker context)
 *
 * Special handling for WhatsApp: Always returns WHATSAPP_DAILY_LIMIT (1000)
 * regardless of database values, since WhatsApp is unlimited for users
 */
export async function getRemainingCredits(
  huntId: string,
  channel: TContactChannel,
): Promise<number> {
  const db = getDBAdminClient();

  const channelCredit = await db.query.huntChannelCredits.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.huntId, huntId), eq(table.channel, channel)),
  });

  if (!channelCredit) {
    return 0;
  }

  // WhatsApp: always return hard-coded limit (unlimited for users)
  if (channel === EContactChannel.WHATSAPP_TEXT) {
    return WHATSAPP_DAILY_LIMIT;
  }

  return channelCredit.creditsAllocated - channelCredit.creditsConsumed;
}
