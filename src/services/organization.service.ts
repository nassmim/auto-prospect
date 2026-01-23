/**
 * Organization service - Helper functions for organization-first architecture
 */

import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { organizations } from "@/schema/organization.schema";
import { eq } from "drizzle-orm";

/**
 * Get the personal organization ID for a given auth user ID
 * In the organization-first pattern, every user has a personal organization (type='personal')
 * This personal organization ID is used for references like createdById, assignedToId, etc.
 *
 * @param authUserId - The Supabase auth.users.id
 * @returns The user's personal organization ID
 * @throws Error if personal organization not found
 */
export async function getUserPersonalOrganizationId(
  authUserId: string
): Promise<string> {
  const dbClient = await createDrizzleSupabaseClient();

  const personalOrg = await dbClient.admin((tx) =>
    tx.query.organizations.findFirst({
      where: eq(organizations.authUserId, authUserId),
      columns: {
        id: true,
      },
    })
  );

  if (!personalOrg) {
    throw new Error(
      `Personal organization not found for user ${authUserId}. This should never happen - every user must have a personal organization.`
    );
  }

  return personalOrg.id;
}

/**
 * Get user information from their personal organization
 *
 * @param authUserId - The Supabase auth.users.id
 * @returns User profile data from their personal organization
 * @throws Error if personal organization not found
 */
export async function getUserProfile(authUserId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  const personalOrg = await dbClient.admin((tx) =>
    tx.query.organizations.findFirst({
      where: eq(organizations.authUserId, authUserId),
      columns: {
        id: true,
        name: true,
        email: true,
        pictureUrl: true,
        phoneNumber: true,
      },
    })
  );

  if (!personalOrg) {
    throw new Error(
      `Personal organization not found for user ${authUserId}`
    );
  }

  return personalOrg;
}
