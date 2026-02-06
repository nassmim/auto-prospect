/****************************************************
DROPS ALL TABLES AND RESETS THE DATABASE TO A CLEAN STATE
THEN RUNS ALL MIGRATIONS VIA DRIZZLE
*****************************************************/

import { defaultDBClient, postgresClient } from "@/lib/drizzle/dbClient";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function resetDB() {
  console.log("🗑️  Dropping all tables and schemas...");

  // Drop all tables in public schema (cascade removes dependencies)
  await defaultDBClient.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      -- Drop all tables
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;

      -- Drop all sequences
      FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
      END LOOP;

      -- Drop all types (enums)
      FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;

      -- Drop all functions
      FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes
                FROM pg_proc INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
                WHERE pg_namespace.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
      END LOOP;

      -- Drop drizzle schema (migration tracking)
      DROP SCHEMA IF EXISTS drizzle CASCADE;
    END $$;
  `);

  console.log("✅ Database cleaned");
  console.log("🔄 Running migrations...");

  // Run all migrations from scratch
  await migrate(defaultDBClient, {
    migrationsFolder: "./drizzle/migrations",
  });

  console.log("✅ Migrations complete");

  // Connection must be closed
  await postgresClient.end();
}

resetDB().catch((error) => {
  console.error("❌ Reset failed:", error);
  process.exit(1);
});
