#!/usr/bin/env tsx
/**
 * Simple user creation script
 * Usage: pnpm tsx scripts/create-user.ts email password name [pictureUrl]
 */

import { createUserProgrammatically } from "../src/services/user-creation.service";

const [email, password] = process.argv.slice(2);

createUserProgrammatically({
  email,
  password,
  emailConfirm: true,
})
  .then((result) => {
    console.log("User created:", result.authUserId);
  })
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
