import { createDrizzleSupabaseClient } from "@/lib/db";
import { desc, TCreditTransaction, TDBQuery } from "@auto-prospect/db";
import { TContactChannel } from "@auto-prospect/shared/src/config/message.config";
import { type TransactionType } from "@auto-prospect/shared/src/config/payment.config";

export type TConsumeCreditsParams = {
  huntId: string;
  channel: TContactChannel;
  messageId?: string;
  recipient?: string;
};

export type TConsumeCreditsResult =
  | { success: true; transaction: TCreditTransaction }
  | { success: false; error: string };

export type TSubscription =
  | void
  | {
      active: boolean;
      id: string;
      accountId: string | null;
      updatedAt: string;
      createdAt: string;
      billingProvider: "stripe" | "lemon-squeezy" | "paddle";
      currency: string;
      billingCustomerId: number;
      status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused";
      cancelAtPeriodEnd: boolean;
      periodStartsAt: string;
      periodEndsAt: string;
      trialStartsAt: string | null;
      trialEndsAt: string | null;
    }
  | undefined;

/**
 * Gets all channel credits for a hunt
 */
export async function getHuntChannelCredits(huntId: string) {
  // call the endpoint
}

/**
 * Gets complete credit data for the authenticated user's account
 * Used by the credits page to display balances, allocations, and transaction history
 */
export async function getAccountCredits() {
  const dbClient = await createDrizzleSupabaseClient();

  // Fetch credit balance, hunt allocations, and transaction history in parallel
  const [balance, huntAllocations, transactions] = await Promise.all([
    // Get account credit balance
    dbClient.rls((tx: TDBQuery) => tx.query.creditBalances.findFirst()),

    // Get hunt channel credit allocations with hunt names
    dbClient.rls((tx: TDBQuery) =>
      tx.query.huntChannelCredits.findMany({
        with: {
          hunt: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ),

    // Get recent credit transactions (last 50)
    dbClient.rls((tx: TDBQuery) =>
      tx.query.creditTransactions.findMany({
        orderBy: (table) => [desc(table.createdAt)],
        limit: 50,
      }),
    ),
  ]);

  return {
    balance,
    huntAllocations: huntAllocations.map((allocation) => ({
      huntId: allocation.huntId,
      huntName: allocation.hunt.name,
      channel: allocation.channel as TContactChannel,
      allocated: allocation.creditsAllocated,
      consumed: allocation.creditsConsumed,
      remaining: allocation.creditsAllocated - allocation.creditsConsumed,
    })),
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type as TransactionType,
      channel: tx.channel as TContactChannel,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
      metadata: tx.metadata,
    })),
  };
}
