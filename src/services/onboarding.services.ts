/**
 * Onboarding service - handles new user setup
 * Organization-first pattern: auto-creates personal organization for each new user
 *
 * In this architecture:
 * - Every user has exactly ONE personal organization (type='personal', 1:1 with auth.users)
 * - Team organizations are created separately and users are linked via organization_members
 * - All user references (createdById, assignedToId, etc.) point to the user's personal org ID
 */

import { createDrizzleSupabaseClient, TDBQuery } from "@/lib/drizzle/dbClient";
import { organizations } from "@/schema/organization.schema";

/**
 * Creates a personal organization for a new user during signup
 * This is the ONLY organization type that has auth_user_id set
 *
 * @param authUserId - Supabase auth.users.id
 * @param userName - User's display name
 * @param userEmail - User's email
 * @param pictureUrl - Optional profile picture URL
 * @returns The created personal organization ID
 */
export async function createPersonalOrganization(
  authUserId: string,
  userName: string,
  userEmail: string,
  pictureUrl?: string,
): Promise<string> {
  const dbClient = await createDrizzleSupabaseClient();

  // Use RLS - policies allow authenticated users to insert their own personal org
  const query = async (tx: TDBQuery) => {
    // Create personal organization (1:1 with auth.users)
    const [org] = await tx
      .insert(organizations)
      .values({
        authUserId, // This makes it a personal org
        name: userName,
        email: userEmail,
        pictureUrl,
        type: "personal",
        // ownerId is NULL for personal orgs (no self-reference)
        ownerId: null,
        settings: null, // Settings are only for team orgs
      })
      .returning();

    return org.id;
  };

  return dbClient.rls(query);
}

/**
 * Gets the personal organization ID for a user
 * Every user MUST have exactly one personal organization
 *
 * @param authUserId - Supabase auth.users.id
 * @returns The user's personal organization ID, or null if not found (should never happen)
 */
export async function getPersonalOrganization(authUserId: string): Promise<string | null> {
  const dbClient = await createDrizzleSupabaseClient();

  const query = (tx: TDBQuery) =>
    tx.query.organizations.findFirst({
      where: (table, { eq }) => eq(table.authUserId, authUserId),
      columns: {
        id: true,
      },
    });

  const org = await dbClient.rls(query);

  return org?.id ?? null;
}
