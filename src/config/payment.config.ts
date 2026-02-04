/**
 * Payment Configuration - SINGLE SOURCE OF TRUTH
 * All payment-related enums, types, and configs
 */

const TRANSACTION_TYPE_DEFINITIONS = [
  {
    key: "PURCHASE",
    value: "purchase",
    label: "Achat",
    description: "Achat de crédits",
    icon: "shopping-cart",
    color: "green",
    isPositive: true,
  },
  {
    key: "USAGE",
    value: "usage",
    label: "Utilisation",
    description: "Consommation de crédits",
    icon: "arrow-down",
    color: "red",
    isPositive: false,
  },
  {
    key: "REFUND",
    value: "refund",
    label: "Remboursement",
    description: "Remboursement de crédits",
    icon: "rotate-ccw",
    color: "green",
    isPositive: true,
  },
  {
    key: "ADJUSTMENT",
    value: "adjustment",
    label: "Ajustement",
    description: "Ajustement manuel",
    icon: "edit",
    color: "orange",
    isPositive: false,
  },
] as const;

export const TRANSACTION_TYPE_CONFIG = Object.fromEntries(
  TRANSACTION_TYPE_DEFINITIONS.map((type) => [type.key, type]),
) as {
  [K in (typeof TRANSACTION_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof TRANSACTION_TYPE_DEFINITIONS)[number],
    { key: K }
  >;
};

export const ETransactionType = Object.fromEntries(
  TRANSACTION_TYPE_DEFINITIONS.map((type) => [type.key, type.value]),
) as {
  [K in (typeof TRANSACTION_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof TRANSACTION_TYPE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TransactionType =
  (typeof TRANSACTION_TYPE_DEFINITIONS)[number]["value"];

export const TRANSACTION_TYPES = TRANSACTION_TYPE_DEFINITIONS;
export const TRANSACTION_TYPE_VALUES = TRANSACTION_TYPE_DEFINITIONS.map(
  (t) => t.value,
);

export const getTransactionTypeConfig = (type: TransactionType) => {
  const config = TRANSACTION_TYPE_DEFINITIONS.find((t) => t.value === type);
  if (!config) throw new Error(`Invalid transaction type: ${type}`);
  return config;
};

export const getTransactionTypeLabel = (type: TransactionType): string => {
  return getTransactionTypeConfig(type).label;
};
