/****************************************************
SEEDS THE DATABASE WITH INITIAL DATA
RUN AFTER MIGRATIONS
*****************************************************/

import { defaultDBClient, postgresClient } from "@/lib/drizzle/dbClient";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

async function seedDB() {
  console.log("🌱 Seeding database...");

  const seedPath = join(process.cwd(), "supabase", "_seed.sql");

  try {
    const seedSQL = readFileSync(seedPath, "utf-8");

    if (!seedSQL.trim()) {
      console.log("⚠️  Seed file is empty, skipping");
      await postgresClient.end();
      return;
    }

    // Execute seed SQL
    await defaultDBClient.execute(sql.raw(seedSQL));

    console.log("✅ Database seeded successfully");
  } catch (error) {
    throw error;
  } finally {
    await postgresClient.end();
  }
}

seedDB().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
