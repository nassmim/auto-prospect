import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import { TAccountServer } from "@/schema/account.schema";
import { TAccountSelectedKeys } from "@/types/account.types";
import { Session } from "@supabase/supabase-js";

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
 * Gets the current user's primary account (overload for no columns - returns full account)
 */
export async function getUseraccount(
  dbClient?: TDBClient,
): Promise<TAccountServer>;

/**
 * Gets the current user's primary account (overload for selected columns)
 */
export async function getUseraccount<
  T extends Partial<Record<keyof TAccountServer, boolean>>,
>(
  dbClient: TDBClient | undefined,
  options: { columnsToKeep: T },
): Promise<Pick<TAccountServer, TAccountSelectedKeys<T>>>;

/**
 * Implementation
 */
export async function getUseraccount(
  dbClient?: TDBClient,
  options?: { columnsToKeep?: Partial<Record<keyof TAccountServer, boolean>> },
): Promise<TAccountServer | Partial<TAccountServer>> {
  const session = await getUserSession();

  const client = dbClient || (await createDrizzleSupabaseClient());

  const account = await client.rls(async (tx) => {
    return tx.query.accounts.findFirst({
      where: (table, { eq }) => eq(table.id, session.user.id),
      ...(options?.columnsToKeep && { columns: options.columnsToKeep }),
    });
  });

  if (!account) throw new Error("account not found");

  return account;
}
