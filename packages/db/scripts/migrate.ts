/****************************************************
MIGRATES TO THE DB WHATEVER IS STORED IN OUR MIGRATION FOLDERS, ESPECIALLY THE SCHEMA
*****************************************************/

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDrizzleAdmin, postgresClient } from "../src/index";

async function migrateDB() {
  const clientAdmin = createDrizzleAdmin();
  // Run migrations on the database, skipping the ones already applied
  await migrate(clientAdmin, {
    migrationsFolder: "./src/drizzle/migrations",
  });
  // Connection must be closed, otherwise the script will hang
  await postgresClient.end();
}

migrateDB();
