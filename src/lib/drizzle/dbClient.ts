import * as schema from "@/schema";
import {
  and,
  DrizzleConfig,
  eq,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import { drizzle, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { createDrizzle } from "@/lib/drizzle/rls/client-wrapper";
import { decode } from "@/lib/drizzle/rls/jwt";
import { createClient } from "@/lib/supabase/server";
import { PgTransaction } from "drizzle-orm/pg-core";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL environment variable is not set");
}

const postgresClient = postgres(databaseUrl, { prepare: false });

const config = {
  casing: "snake_case",
  schema,
  logger: false,
} satisfies DrizzleConfig<typeof schema>;

const defaultDBClient = drizzle({
  client: postgresClient,
  ...config,
});

// https://github.com/orgs/supabase/discussions/23224
// Should be secure because we use the access token that is signed, and not the data read directly from the storage
async function createDrizzleSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return createDrizzle(decode(session?.access_token ?? ""), {
    admin: defaultDBClient,
    client: defaultDBClient,
  });
}

type TDBModel = keyof typeof defaultDBClient.query;
type TDBClient = Awaited<ReturnType<typeof createDrizzleSupabaseClient>>;
type TDBQuery =
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | typeof defaultDBClient;

type TEqOperator = typeof eq;
type TANDperator = typeof and;

export { createDrizzleSupabaseClient, defaultDBClient, postgresClient };

export type { TANDperator, TDBClient, TDBModel, TDBQuery, TEqOperator };
