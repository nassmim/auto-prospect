import {
  and,
  DrizzleConfig,
  eq,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import { drizzle, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";

import { PgTransaction } from "drizzle-orm/pg-core";
import { createDrizzle } from "./rls/client-wrapper";
import { decode } from "./rls/jwt";

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

// Version AVEC RLS — prend un access token en paramètre
// C'est l'app appelante qui fournit le token
function createDrizzleWithRLS(accessToken: string) {
  return createDrizzle(decode(accessToken), {
    admin: defaultDBClient,
    client: defaultDBClient,
  });
}

// Version SANS RLS — accès admin direct (pour le worker)
function createDrizzleAdmin() {
  return defaultDBClient;
}

export { createDrizzleAdmin, createDrizzleWithRLS, postgresClient };

type TDBModel = keyof typeof defaultDBClient.query;
type TDBClient = Awaited<ReturnType<typeof createDrizzleWithRLS>>;
type TDBQuery =
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | typeof defaultDBClient;

type TEqOperator = typeof eq;
type TANDperator = typeof and;
type TDBOptions = { dbClient?: TDBClient; bypassRLS?: boolean };

export type {
  TANDperator,
  TDBClient,
  TDBModel,
  TDBOptions,
  TDBQuery,
  TEqOperator,
};
