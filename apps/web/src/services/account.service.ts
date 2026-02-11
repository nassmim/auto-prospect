import { createDrizzleSupabaseClient } from "@/lib/db";
import {
  TAccount,
  TAccountSelectedKeys,
  TDBWithTokenClient,
} from "@auto-prospect/db";

/**
 * Gets the current user's primary account (overload for no columns - returns full account)
 */
export async function getUserAccount(
  dbClient?: TDBWithTokenClient,
): Promise<TAccount>;

/**
 * Gets the current user's primary account (overload for selected columns)
 */
export async function getUserAccount<
  T extends Partial<Record<keyof TAccount, boolean>>,
>(
  dbClient: TDBWithTokenClient | undefined,
  options: { columnsToKeep: T },
): Promise<Pick<TAccount, TAccountSelectedKeys<T>>>;

/**
 * Implementation
 */
export async function getUserAccount(
  dbClient?: TDBWithTokenClient,
  options?: { columnsToKeep?: Partial<Record<keyof TAccount, boolean>> },
): Promise<TAccount | Partial<TAccount>> {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const account = await client.rls(async (tx) => {
    return tx.query.accounts.findFirst({
      ...(options?.columnsToKeep && { columns: options.columnsToKeep }),
    });
  });

  if (!account) throw new Error("account not found");

  return account;
}
