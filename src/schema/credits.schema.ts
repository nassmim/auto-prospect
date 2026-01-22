import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, serviceRole } from "drizzle-orm/supabase";
import { organizations } from "./organization.schema";
import { accounts } from "./account.schema";

// Transaction types
export const transactionTypes = [
  "purchase",
  "usage",
  "refund",
  "adjustment",
] as const;
export type TransactionType = (typeof transactionTypes)[number];

// Credit types
export const creditTypes = ["sms", "voice"] as const;
export type CreditType = (typeof creditTypes)[number];

// Credit pack pricing (from PRD)
export const SMS_PACKS = [
  { credits: 100, priceEur: 15 },
  { credits: 500, priceEur: 70 },
  { credits: 1000, priceEur: 100 },
  { credits: 5000, priceEur: 400 },
] as const;

export const VOICE_PACKS = [
  { credits: 100, priceEur: 40 },
  { credits: 500, priceEur: 175 },
  { credits: 1000, priceEur: 300 },
  { credits: 5000, priceEur: 1250 },
] as const;

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
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull().unique(),
    smsCredits: integer("sms_credits").notNull().default(0),
    voiceCredits: integer("voice_credits").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "credit_balances_organization_id_fk",
    }).onDelete("cascade"),
    index("credit_balances_organization_id_idx").on(table.organizationId),
    // Organization members can read their balance
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
    // Only service role can update balances (via backend services)
    pgPolicy("enable update for service role", {
      as: "permissive",
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    // Only service role can insert balances (during org creation)
    pgPolicy("enable insert for service role", {
      as: "permissive",
      for: "insert",
      to: serviceRole,
      withCheck: sql`true`,
    }),
  ],
);

// Credit transactions table - immutable audit log
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    type: varchar({ length: 20 })
      .$type<TransactionType>()
      .notNull(),
    creditType: varchar("credit_type", { length: 10 })
      .$type<CreditType>()
      .notNull(),
    amount: integer().notNull(), // Positive for purchase/refund, negative for usage
    balanceAfter: integer("balance_after").notNull(), // Balance snapshot after transaction
    referenceId: uuid("reference_id"), // Message ID for usage, payment ID for purchase
    metadata: jsonb().$type<TransactionMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdById: uuid("created_by_id"), // Null for system transactions
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "credit_transactions_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "credit_transactions_created_by_id_fk",
    }).onDelete("set null"),
    // Index for transaction history queries
    index("credit_transactions_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("credit_transactions_reference_id_idx").on(table.referenceId),
    // Organization members can read transaction history
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
    // Only service role can insert transactions (immutable log)
    pgPolicy("enable insert for service role", {
      as: "permissive",
      for: "insert",
      to: serviceRole,
      withCheck: sql`true`,
    }),
  ],
);

// Relations
export const creditBalancesRelations = relations(
  creditBalances,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [creditBalances.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [creditTransactions.organizationId],
      references: [organizations.id],
    }),
    createdBy: one(accounts, {
      fields: [creditTransactions.createdById],
      references: [accounts.id],
    }),
  }),
);
