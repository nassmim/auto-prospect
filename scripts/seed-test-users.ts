#!/usr/bin/env tsx
/**
 * Seed test users for development
 * Usage: pnpm tsx scripts/seed-test-users.ts
 */

import { createUserProgrammatically } from "../src/services/user-creation.service";

const testUsers = [
  {
    email: "admin@test.com",
    password: "AdminPass123!",
    name: "Test Admin",
  },
  {
    email: "user@test.com",
    password: "UserPass123!",
    name: "Test User",
  },
  {
    email: "demo@test.com",
    password: "DemoPass123!",
    name: "Demo Account",
  },
];

async function seedUsers() {
  console.log("🌱 Seeding test users...\n");

  for (const userData of testUsers) {
    try {
      const user = await createUserProgrammatically({
        ...userData,
        emailConfirm: true,
      });
      console.log(`✅ Created ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   User ID: ${user.authUserId}\n`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("already registered")) {
          console.log(`⚠️  ${userData.email} already exists\n`);
        } else {
          console.error(`❌ Failed to create ${userData.email}:`, error.message, "\n");
        }
      }
    }
  }

  console.log("✨ Seeding complete");
  console.log("\nYou can now login with any of these accounts:");
  testUsers.forEach(u => {
    console.log(`  - ${u.email} / ${u.password}`);
  });
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
