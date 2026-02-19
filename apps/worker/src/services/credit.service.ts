/**
 * Credit Service - Worker Context
 *
 * Credit consumption for message workers (admin context)
 */

import {
  creditBalances,
  creditTransactions,
  getDBAdminClient,
} from "@auto-prospect/db";
import {
  EContactChannel,
  TContactChannel,
  WHATSAPP_DAILY_LIMIT,
} from "@auto-prospect/shared/src/config/message.config";
import { ETransactionType } from "@auto-prospect/shared/src/config/payment.config";
import { eq, sql } from "drizzle-orm";

export type TConsumeCreditsParams = {
  accountId: string;
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
  accountId,
  huntId,
  channel,
  messageId,
  recipient,
}: TConsumeCreditsParams): Promise<TConsumeCreditsResult> {
  const db = getDBAdminClient();

  try {
    const result = await db.transaction(async (tx) => {
      // Lock creditBalances row for this account
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.accountId, accountId))
        .for("update");

      if (!balance) {
        throw new Error(`No credit balance found for account ${accountId}`);
      }

      // Get current balance for channel
      const currentBalance =
        channel === EContactChannel.SMS
          ? balance.sms
          : channel === EContactChannel.RINGLESS_VOICE
            ? balance.ringlessVoice
            : balance.whatsappText;

      // WhatsApp: never fail on balance (unlimited for users)
      // Other channels: fail if insufficient credits
      if (channel !== EContactChannel.WHATSAPP_TEXT && currentBalance <= 0) {
        throw new Error(`Insufficient credits for channel ${channel}`);
      }

      // Decrement atomically
      const columnName =
        channel === EContactChannel.SMS
          ? "sms"
          : channel === EContactChannel.RINGLESS_VOICE
            ? "ringlessVoice"
            : "whatsappText";

      const [updated] = await tx
        .update(creditBalances)
        .set({
          [columnName]: sql`${creditBalances[columnName]} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.accountId, accountId))
        .returning();

      const newBalance =
        channel === EContactChannel.SMS
          ? updated.sms
          : channel === EContactChannel.RINGLESS_VOICE
            ? updated.ringlessVoice
            : updated.whatsappText;

      // Create transaction log
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          accountId,
          type: ETransactionType.USAGE,
          channel,
          amount: -1,
          balanceAfter: newBalance,
          referenceId: messageId ? messageId : undefined,
          metadata: {
            messageId,
            recipient,
            huntId,
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
  accountId: string,
  channel: TContactChannel,
): Promise<number> {
  // WhatsApp: always return hard-coded limit (unlimited for users)
  if (channel === EContactChannel.WHATSAPP_TEXT) {
    return WHATSAPP_DAILY_LIMIT;
  }

  const db = getDBAdminClient();

  const balance = await db.query.creditBalances.findFirst({
    where: (table, { eq }) => eq(table.accountId, accountId),
  });

  if (!balance) {
    return 0;
  }

  return channel === EContactChannel.SMS
    ? balance.sms
    : balance.ringlessVoice;
}
