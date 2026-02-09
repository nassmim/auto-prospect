import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { TAccount, TAccountSelectedKeys } from "@/schema/account.schema";
import { Session, User } from "@supabase/supabase-js";
import { createClient } from "../../../../packages/db/src/supabase/server";

/**
 * Gets the current user's session
 */
export async function getUserSession(): Promise<
  Session | { user: { id: "" } }
> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw new Error(error.message);

  if (!session) return { user: { id: "" } };

  return session;
}

/**
 * Gets the current user
 */
export async function getAuthser(): Promise<User | { id: "" }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  if (!user) return { id: "" };

  return user;
}

/**
 * Gets the current user's primary account (overload for no columns - returns full account)
 */
export async function getUserAccount(dbClient?: TDBClient): Promise<TAccount>;

/**
 * Gets the current user's primary account (overload for selected columns)
 */
export async function getUserAccount<
  T extends Partial<Record<keyof TAccount, boolean>>,
>(
  dbClient: TDBClient | undefined,
  options: { columnsToKeep: T },
): Promise<Pick<TAccount, TAccountSelectedKeys<T>>>;

/**
 * Implementation
 */
export async function getUserAccount(
  dbClient?: TDBClient,
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
