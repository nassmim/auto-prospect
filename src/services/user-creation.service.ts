/**
 * User Creation Service
 * Programmatically creates users with their personal organizations
 *
 * This service handles the full user setup flow:
 * 1. Create auth user in Supabase Auth
 * 2. Database trigger automatically creates personal organization (organization-first architecture)
 * 3. Return both auth user ID and personal org ID
 *
 */

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { organizations } from "@/schema/organization.schema";
import { eq } from "drizzle-orm";

export interface CreateUserParams {
  email: string;
  password: string;
  emailConfirm?: boolean; // Whether to auto-confirm email (default: true for programmatic creation)
}

export interface CreateUserResult {
  authUserId: string;
  personalOrgId: string;
  email: string;
}

/**
 * Waits for and retrieves the personal organization created by database trigger
 * Retries with exponential backoff since trigger execution is async
 *
 * @param authUserId - The auth.users.id to find organization for
 * @param maxAttempts - Maximum retry attempts (default: 5)
 * @returns Personal organization ID
 * @throws Error if organization not found after all retries
 */
async function waitForPersonalOrganization(
  authUserId: string,
  maxAttempts = 5,
): Promise<string> {
  const dbClient = await createDrizzleSupabaseClient();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Query with admin privileges (bypass RLS)
    const [org] = await dbClient.admin
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.authUserId, authUserId))
      .limit(1);

    if (org) {
      return org.id;
    }

    // Wait with exponential backoff (100ms, 200ms, 400ms, 800ms, 1600ms)
    if (attempt < maxAttempts) {
      await new Promise((resolve) =>
        setTimeout(resolve, 100 * Math.pow(2, attempt - 1)),
      );
    }
  }

  throw new Error(
    `Personal organization not created by trigger after ${maxAttempts} attempts. ` +
      "Check database trigger: handle_new_user_organization",
  );
}

/**
 * Creates a new user programmatically with their personal organization
 *
 * The personal organization is automatically created by the database trigger
 * (on_auth_user_created_organization) which runs after user insertion into auth.users.
 *
 * @param params - User creation parameters
 * @returns Created user information including auth ID and personal org ID
 * @throws Error if user creation fails or organization setup fails
 */
export async function createUserProgrammatically(
  params: CreateUserParams,
): Promise<CreateUserResult> {
  const { email, password, emailConfirm = true } = params;

  const adminClient = createAdminClient();

  // Step 1: Create auth user using admin API
  // This triggers handle_new_user_organization() which creates personal organization
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirm,
    });

  if (authError || !authData.user) {
    throw new Error(
      `Failed to create auth user: ${authError?.message || "Unknown error"}`,
    );
  }

  const authUserId = authData.user.id;

  try {
    // Step 2: Wait for database trigger to create personal organization
    // The trigger runs asynchronously, so we poll for the organization
    const personalOrgId = await waitForPersonalOrganization(authUserId);

    return {
      authUserId,
      personalOrgId,
      email,
    };
  } catch (orgError) {
    // Rollback: delete the auth user if organization creation fails
    await adminClient.auth.admin.deleteUser(authUserId);
    throw new Error(
      `Failed to retrieve personal organization created by trigger, user rolled back: ${
        orgError instanceof Error ? orgError.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Deletes a user and their associated personal organization
 *
 * @param authUserId - The auth.users.id to delete
 * @throws Error if deletion fails
 */
export async function deleteUserProgrammatically(
  authUserId: string,
): Promise<void> {
  const adminClient = createAdminClient();

  // Delete auth user (cascade will handle personal organization via RLS)
  const { error } = await adminClient.auth.admin.deleteUser(authUserId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
