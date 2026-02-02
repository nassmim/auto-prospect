import { EContactChannel } from "@/constants/enums";
import { TCreditTransaction } from "@/schema/credits.schema";

// Metadata types for transactions
type PurchaseMetadata = {
  packCredits: number;
  priceEur: number;
  paymentProvider?: string;
  paymentId?: string;
};

type UsageMetadata = {
  messageId?: string;
  recipient?: string;
  duration?: number; // For voice calls, in seconds
};

type AdjustmentMetadata = {
  reason: string;
  adjustedBy: string;
};

export type TTransactionMetadata =
  | PurchaseMetadata
  | UsageMetadata
  | AdjustmentMetadata;

export type TConsumeCreditsParams = {
  huntId: string;
  channel: EContactChannel;
  messageId?: string;
  recipient?: string;
  bypassRLS?: boolean;
};

export type TConsumeCreditsResult =
  | { success: true; transaction: TCreditTransaction }
  | { success: false; error: string };
