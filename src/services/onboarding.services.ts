/**
 * Onboarding service - handles new user setup
 * Organization-first pattern: auto-creates personal organization for each new user
 */

import { createDrizzleSupabaseClient, TDBQuery } from "@/lib/drizzle/dbClient";
import { accounts } from "@/schema/account.schema";
import { organizations, organizationMembers } from "@/schema/organization.schema";

/**
 * Creates a personal organization for a new user
 * Called during signup flow to ensure every user has an organization
 *
 * @param userId - Supabase auth.users.id (same as accounts.id)
 * @param userName - User's display name
 * @param userEmail - User's email
 * @returns The created organization ID
 */
export async function createPersonalOrganization(
  userId: string,
  userName: string,
  userEmail: string,
): Promise<string> {
  const dbClient = await createDrizzleSupabaseClient();

  // Use RLS - policies allow authenticated users to insert their own records
  const query = async (tx: TDBQuery) => {
    // Create account record (mirrors auth.users)
    await tx.insert(accounts).values({
      id: userId,
      name: userName,
      email: userEmail,
      isPersonalAccount: true,
    });

    // Create personal organization (named after user)
    const [org] = await tx
      .insert(organizations)
      .values({
        name: `${userName}'s Workspace`,
        ownerId: userId,
        settings: {
          allowReassignment: true,
          restrictVisibility: false,
        },
      })
      .returning();

    // Add user as organization owner
    await tx.insert(organizationMembers).values({
      organizationId: org.id,
      accountId: userId,
      role: "owner",
      joinedAt: new Date(),
    });

    return org.id;
  };

  return dbClient.rls(query);
}

/**
 * Gets the personal organization for a user (where they are the only member)
 * Useful for determining which org to use for solo user workflows
 */
export async function getPersonalOrganization(userId: string): Promise<string | null> {
  const dbClient = await createDrizzleSupabaseClient();

  // Query with RLS wrapper pattern (follows ad.actions.ts pattern)
  const query = (tx: TDBQuery) =>
    tx.query.organizationMembers.findFirst({
      where: (table, { eq }) => eq(table.accountId, userId),
      columns: {
        organizationId: true,
      },
    });

  const membership = await dbClient.rls(query);

  return membership?.organizationId ?? null;
}
