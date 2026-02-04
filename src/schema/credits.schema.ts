import { TRANSACTION_TYPE_VALUES } from "@/config/payment.config";
import { channel } from "@/schema/message.schema";
import { TTransactionMetadata } from "@/types/payment.types";
import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  smallserial,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { accounts } from "./account.schema";
import { hunts } from "./hunt.schema";

// Transaction types enum
export const transactionType = pgEnum(
  "transaction_type",
  TRANSACTION_TYPE_VALUES as [string, ...string[]],
);

// Credit balances table - one row per account
export const creditBalances = pgTable(
  "credit_balances",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
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
    index("credit_balances_account_id_idx").on(table.accountId),
    pgPolicy("enable read for credit walet owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
    }),
    // // account members can read their balance
    // pgPolicy("enable read for account members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and om.auth_user_id = ${authUid}
    //     and om.joined_at is not null
    //   )`,
    // }),
    // Only service role can update balances (via backend services)
  ],
);
export type TCreditBalanceServer = InferSelectModel<typeof creditBalances>;

// Credit transactions table - immutable audit log
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    type: transactionType().notNull(),
    channel: channel().notNull(),
    amount: integer().notNull(), // Positive for purchase/refund, negative for usage
    balanceAfter: integer("balance_after").notNull(), // Balance snapshot after transaction
    referenceId: uuid("reference_id"), // Message ID for usage, payment ID for purchase
    metadata: jsonb().$type<TTransactionMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Index for transaction history queries
    index("credit_transactions_org_created_idx").on(
      table.accountId,
      table.createdAt,
    ),
    index("credit_transactions_reference_id_idx").on(table.referenceId),
    pgPolicy("enable read for transaction owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
    }),
    // // account members can read transaction history
    // pgPolicy("enable read for account members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and om.member_account_id in (
    //       select id from accounts where auth_user_id = ${authUid}
    //     )
    //     and om.joined_at is not null
    //   )`,
    // })
  ],
);
export type TCreditTransaction = InferSelectModel<typeof creditTransactions>;

// Credit packs table - pricing configuration
export const creditPacks = pgTable(
  "credit_packs",
  {
    id: smallserial().primaryKey(),
    channel: channel().notNull(),
    credits: integer().notNull(),
    priceEur: integer("price_eur").notNull(), // Store in cents for precision
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    index("credit_packs_credit_type_idx").on(table.channel),
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
export type TCreditPack = InferSelectModel<typeof creditPacks>;

// Hunt channel credits table - per-hunt, per-channel credit allocation
export const huntChannelCredits = pgTable(
  "hunt_channel_credits",
  {
    id: uuid().defaultRandom().primaryKey(),
    huntId: uuid("hunt_id").notNull(),
    channel: channel().notNull(),
    creditsAllocated: integer("credits_allocated").notNull().default(0),
    creditsConsumed: integer("credits_consumed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.huntId],
      foreignColumns: [hunts.id],
      name: "hunt_channel_credits_hunt_id_fk",
    }).onDelete("cascade"),
    unique("hunt_channel_unique").on(table.huntId, table.channel),
    index("hunt_channel_credits_hunt_id_idx").on(table.huntId),
    pgPolicy("enable all for hunt owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from hunts h
        where h.id = ${table.huntId}
        and h.account_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from hunts h
        where h.id = ${table.huntId}
        and h.account_id = ${authUid}
      )`,
    }),
  ],
);
export type THuntChannelCredit = InferSelectModel<typeof huntChannelCredits>;
export type THuntChannelCreditInsert = InferInsertModel<
  typeof huntChannelCredits
>;

// Relations
export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  account: one(accounts, {
    fields: [creditBalances.accountId],
    references: [accounts.id],
  }),
}));

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    account: one(accounts, {
      fields: [creditTransactions.accountId],
      references: [accounts.id],
    }),
  }),
);

export const huntChannelCreditsRelations = relations(
  huntChannelCredits,
  ({ one }) => ({
    hunt: one(hunts, {
      fields: [huntChannelCredits.huntId],
      references: [hunts.id],
    }),
  }),
);
