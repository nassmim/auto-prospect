import { ECreditType, ETransactionType } from "@/constants/enums";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { organizations } from "./organization.schema";

// Transaction types enum
export const transactionType = pgEnum(
  "transaction_type",
  Object.values(ETransactionType) as [string, ...string[]],
);
export type TransactionType = (typeof ETransactionType)[keyof typeof ETransactionType];

// Credit types enum
export const creditType = pgEnum(
  "credit_type",
  Object.values(ECreditType) as [string, ...string[]],
);
export type CreditType = (typeof ECreditType)[keyof typeof ECreditType];


// Metadata types for transactions
export type PurchaseMetadata = {
  packCredits: number;
  priceEur: number;
  paymentProvider?: string;
  paymentId?: string;
};

export type UsageMetadata = {
  messageId?: string;
  recipient?: string;
  duration?: number; // For voice calls, in seconds
};

export type AdjustmentMetadata = {
  reason: string;
  adjustedBy: string;
};

export type TransactionMetadata =
  | PurchaseMetadata
  | UsageMetadata
  | AdjustmentMetadata;

// Credit balances table - one row per organization
export const creditBalances = pgTable(
  "credit_balances",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    sms: integer("sms").notNull().default(0),
    ringlessVoice: integer("ringless_voice").notNull().default(0),
    whatsappText: integer("whatsapp").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("credit_balances_organization_id_idx").on(table.organizationId),
    pgPolicy("enable read for credit walet owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organizations o
        where o.id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
      )`,
    }),
    // // Organization members can read their balance
    // pgPolicy("enable read for organization members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and om.auth_user_id = ${authUid}
    //     and om.joined_at is not null
    //   )`,
    // }),
    // Only service role can update balances (via backend services)
  ],
);
export type TCreditBalance = InferSelectModel<typeof creditBalances>;

// Credit transactions table - immutable audit log
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    type: transactionType().notNull(),
    creditType: creditType().notNull(),
    amount: integer().notNull(), // Positive for purchase/refund, negative for usage
    balanceAfter: integer("balance_after").notNull(), // Balance snapshot after transaction
    referenceId: uuid("reference_id"), // Message ID for usage, payment ID for purchase
    metadata: jsonb().$type<TransactionMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Index for transaction history queries
    index("credit_transactions_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("credit_transactions_reference_id_idx").on(table.referenceId),
    pgPolicy("enable read for transaction owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
            select 1 from organizations o
            where o.id = ${table.organizationId}
            and o.auth_user_id = ${authUid}
          )`,
    }),
    // // Organization members can read transaction history
    // pgPolicy("enable read for organization members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and om.member_organization_id in (
    //       select id from organizations where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // })
  ],
);
export type TCreditTransaction = InferSelectModel<typeof creditTransactions>;

// Relations
export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditBalances.organizationId],
    references: [organizations.id],
  }),
}));

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [creditTransactions.organizationId],
      references: [organizations.id],
    }),
  }),
);

// Credit packs table - pricing configuration
export const creditPacks = pgTable(
  "credit_packs",
  {
    id: uuid().defaultRandom().primaryKey(),
    creditType: creditType().notNull(),
    credits: integer().notNull(),
    priceEur: integer("price_eur").notNull(), // Store in cents for precision
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_packs_credit_type_idx").on(table.creditType),
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
export type TCreditPack = InferSelectModel<typeof creditPacks>;
