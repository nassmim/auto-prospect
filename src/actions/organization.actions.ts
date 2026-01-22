"use server";

import { revalidatePath } from "next/cache";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { createClient } from "@/lib/supabase/server";
import {
  organizations,
  organizationMembers,
  organizationInvitations,
  type OrganizationSettings,
} from "@/schema/organization.schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Gets the current user's organization with member role
 */
export async function getCurrentOrganization() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const membership = await dbClient.rls(async (tx) => {
    return tx.query.organizationMembers.findFirst({
      where: (table, { and, eq, isNotNull }) =>
        and(
          eq(table.accountId, session.user.id),
          isNotNull(table.joinedAt),
        ),
      with: {
        organization: true,
      },
    });
  });

  if (!membership) {
    throw new Error("No organization found");
  }

  return {
    organization: membership.organization,
    role: membership.role as "owner" | "admin" | "user",
  };
}

/**
 * Updates organization settings (partial update)
 */
export async function updateOrganizationSettings(
  settings: Partial<OrganizationSettings>,
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const { organization, role } = await getCurrentOrganization();

    // Only owner and admin can update settings
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only admins can update organization settings");
    }

    // Merge with existing settings
    const currentSettings = (organization.settings as OrganizationSettings) || {};
    const newSettings = { ...currentSettings, ...settings };

    await dbClient.rls(async (tx) => {
      await tx
        .update(organizations)
        .set({ settings: newSettings })
        .where(eq(organizations.id, organization.id));
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating organization settings:", error);
    throw error;
  }
}

/**
 * Updates organization name
 */
export async function updateOrganizationName(name: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Organization name is required");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const { organization, role } = await getCurrentOrganization();

    // Only owner can update org name
    if (role !== "owner") {
      throw new Error("Only owner can update organization name");
    }

    await dbClient.rls(async (tx) => {
      await tx
        .update(organizations)
        .set({ name: name.trim() })
        .where(eq(organizations.id, organization.id));
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating organization name:", error);
    throw error;
  }
}

/**
 * Gets all members of the current organization
 */
export async function getOrganizationMembers() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const { organization } = await getCurrentOrganization();

  const members = await dbClient.rls(async (tx) => {
    return tx.query.organizationMembers.findMany({
      where: (table, { and, eq, isNotNull }) =>
        and(
          eq(table.organizationId, organization.id),
          isNotNull(table.joinedAt),
        ),
      with: {
        account: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  });

  return members;
}

/**
 * Gets pending invitations for the current organization
 */
export async function getOrganizationInvitations() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  const { organization } = await getCurrentOrganization();

  const invitations = await dbClient.rls(async (tx) => {
    return tx.query.organizationInvitations.findMany({
      where: (table, { and, eq, gt }) =>
        and(
          eq(table.organizationId, organization.id),
          gt(table.expiresAt, new Date()), // Only non-expired
        ),
    });
  });

  return invitations;
}

/**
 * Invites a new team member to the organization
 */
export async function inviteTeamMember(email: string, role: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Invalid email address");
  }

  if (!["user", "admin"].includes(role)) {
    throw new Error("Invalid role");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const { organization, role: userRole } = await getCurrentOrganization();

    // Only owner and admin can invite
    if (userRole !== "owner" && userRole !== "admin") {
      throw new Error("Only admins can invite team members");
    }

    // Check if user already exists in org
    const existingMember = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.organizationId, organization.id)),
        with: {
          account: {
            where: (account, { eq }) => eq(account.email, email.toLowerCase()),
          },
        },
      });
    });

    if (existingMember && existingMember.account) {
      throw new Error("User is already a member of this organization");
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await dbClient.rls(async (tx) => {
      await tx.insert(organizationInvitations).values({
        organizationId: organization.id,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      });
    });

    // TODO: Send invitation email in production
    // For MVP, just create the invitation record

    revalidatePath("/settings");

    return { success: true, token };
  } catch (error) {
    console.error("Error inviting team member:", error);
    throw error;
  }
}

/**
 * Removes a team member from the organization
 */
export async function removeTeamMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const { organization, role } = await getCurrentOrganization();

    // Only owner and admin can remove members
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only admins can remove team members");
    }

    // Get member to remove
    const memberToRemove = await dbClient.rls(async (tx) => {
      return tx.query.organizationMembers.findFirst({
        where: (table, { eq }) => eq(table.id, memberId),
      });
    });

    if (!memberToRemove) {
      throw new Error("Member not found");
    }

    // Check if trying to remove owner
    if (memberToRemove.role === "owner") {
      throw new Error("Cannot remove organization owner");
    }

    // Check if non-owner trying to remove admin
    if (role !== "owner" && memberToRemove.role === "admin") {
      throw new Error("Only owner can remove admins");
    }

    await dbClient.rls(async (tx) => {
      await tx
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.id, memberId),
            eq(organizationMembers.organizationId, organization.id),
          ),
        );
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
}

/**
 * Cancels a pending invitation
 */
export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    const { organization, role } = await getCurrentOrganization();

    // Only owner and admin can cancel invitations
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only admins can cancel invitations");
    }

    await dbClient.rls(async (tx) => {
      await tx
        .delete(organizationInvitations)
        .where(
          and(
            eq(organizationInvitations.id, invitationId),
            eq(organizationInvitations.organizationId, organization.id),
          ),
        );
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Error canceling invitation:", error);
    throw error;
  }
}
