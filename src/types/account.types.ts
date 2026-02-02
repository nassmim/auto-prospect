import { TAccount } from "@/schema/account.schema";

/**
 * Type helper to extract keys from columns object where value is true
 */
export type TAccountSelectedKeys<
  T extends Partial<Record<keyof TAccount, boolean>>,
> = {
  [K in keyof T]: T[K] extends true ? K : never;
}[keyof T] &
  keyof TAccount;
