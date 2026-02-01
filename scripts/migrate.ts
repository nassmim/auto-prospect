/****************************************************
MIGRATES TO THE DB WHATEVER IS STORED IN OUR MIGRATION FOLDERS, ESPECIALLY THE SCHEMA
*****************************************************/

import { defaultDBClient, postgresClient } from "@/lib/drizzle/dbClient";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function migrateDB() {
    // Run migrations on the database, skipping the ones already applied
    await migrate(defaultDBClient, {
        migrationsFolder: "./supabase/migrations",
    });
    // Connection must be closed, otherwise the script will hang
    await postgresClient.end();
}

migrateDB();
