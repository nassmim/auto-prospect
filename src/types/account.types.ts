import type { TAccountServer } from "@/schema/account.schema";

/**
 * Type helper to extract keys from columns object where value is true
 */
export type TAccountSelectedKeys<
  T extends Partial<Record<keyof TAccountServer, boolean>>,
> = {
  [K in keyof T]: T[K] extends true ? K : never;
}[keyof T] &
  keyof TAccountServer;

// account settings type for JSONB field
export type TAccountSettings = {
  allowReassignment?: boolean;
  restrictVisibility?: boolean;
  dailyReset?: boolean;
  ignorePhonesVisible?: boolean;
};

/**
 * User account type for client components
 * Re-exports TAccountServer for use in client components via type-only import
 */
export type { TAccountServer as TAccountClient } from "@/schema/account.schema";
