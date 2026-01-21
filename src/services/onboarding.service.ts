/**
 * Onboarding service - handles new user setup
 * Organization-first pattern: auto-creates personal organization for each new user
 */

import { db, adminDb } from "@/lib/drizzle/dbClient";
import { accounts } from "@/schema/account.schema";
import { organizations, organizationMembers } from "@/schema/organization.schema";
import { eq } from "drizzle-orm";

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
  // Create account record (mirrors auth.users)
  await adminDb.insert(accounts).values({
    id: userId,
    name: userName,
    email: userEmail,
    isPersonalAccount: true,
  });

  // Create personal organization (named after user)
  const [org] = await adminDb
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
  await adminDb.insert(organizationMembers).values({
    organizationId: org.id,
    accountId: userId,
    role: "owner",
    joinedAt: new Date(),
  });

  return org.id;
}

/**
 * Gets the personal organization for a user (where they are the only member)
 * Useful for determining which org to use for solo user workflows
 */
export async function getPersonalOrganization(userId: string): Promise<string | null> {
  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMembers.organizationId),
    )
    .where(eq(organizationMembers.accountId, userId))
    .where(eq(organizations.ownerId, userId))
    .limit(1);

  return membership?.organizationId ?? null;
}
