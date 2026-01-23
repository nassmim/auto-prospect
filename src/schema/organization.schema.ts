import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

// Organization settings type for JSONB field
export type OrganizationSettings = {
  allowReassignment?: boolean;
  restrictVisibility?: boolean;
  dailyReset?: boolean;
  ignorePhonesVisible?: boolean;
};

// Organization types - discriminated union
export const organizationTypes = ["personal", "team"] as const;
export type OrganizationType = (typeof organizationTypes)[number];

// Organizations table - unified entity for both user profiles (personal) and teams
// Personal org: type='personal', authUserId set, ownerId NULL
// Team org: type='team', authUserId NULL, ownerId references creator's personal org
export const organizations = pgTable(
  "organizations",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    // User identity (for personal orgs only, 1:1 with auth.users)
    authUserId: uuid("auth_user_id"),
    // Profile/Team info
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 320 }),
    pictureUrl: varchar("picture_url", { length: 1000 }),
    phoneNumber: varchar("phone_number", { length: 14 }),
    // Organization type discriminator
    type: varchar({ length: 20 }).notNull().default("personal"),
    // Team-specific fields (NULL for personal orgs)
    ownerId: uuid("owner_id"), // References personal org of creator (NULL for personal orgs)
    settings: jsonb().$type<OrganizationSettings>(),
    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Self-reference for team ownership (set null when personal org deleted)
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [table.id],
      name: "organizations_owner_id_fk",
    }).onDelete("set null"),
    // Unique index on authUserId for personal orgs (1:1 with auth.users)
    index("organizations_auth_user_id_idx").on(table.authUserId),
    unique("organizations_auth_user_id_key").on(table.authUserId),
    index("organizations_owner_id_idx").on(table.ownerId),
    // Authenticated users can create organizations
    // Personal org: created by database trigger on signup
    // Team org: created by users who already have a personal org
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`
        ${authUid} = auth_user_id OR
        exists (
          select 1 from organizations o
          where o.auth_user_id = ${authUid}
          and o.type = 'personal'
        )
      `,
    }),
    // Users can update their own personal org OR team orgs where they're owner/admin
    pgPolicy("enable update for organization owner", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = ${table.id}
          and o.auth_user_id = ${authUid}
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      `,
      withCheck: sql`
        ${authUid} = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = ${table.id}
          and o.auth_user_id = ${authUid}
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      `,
    }),
    // Users can delete their personal org OR team orgs they own
    pgPolicy("enable delete for organization owner", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = ${table.id}
          and o.auth_user_id = ${authUid}
          and om.role = 'owner'
          and om.joined_at is not null
        )
      `,
    }),
    // Members can read their personal org OR team orgs they belong to
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = ${table.id}
          and o.auth_user_id = ${authUid}
          and om.joined_at is not null
        )
      `,
    }),
  ],
);

// Role enum type for organization members
export const organizationRoles = ["owner", "admin", "user"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];

// Organization members table - links personal orgs (members) to team orgs with roles
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    memberOrganizationId: uuid("member_organization_id").notNull(), // References personal org of member
    role: varchar({ length: 20 }).notNull().default("user"),
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "organization_members_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.memberOrganizationId],
      foreignColumns: [organizations.id],
      name: "organization_members_member_organization_id_fk",
    }).onDelete("cascade"),
    unique("organization_members_org_member_key").on(
      table.organizationId,
      table.memberOrganizationId,
    ),
    index("organization_members_organization_id_idx").on(table.organizationId),
    index("organization_members_member_organization_id_idx").on(table.memberOrganizationId),
    // Authenticated users can insert themselves as members
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = ${authUid}
        and o.type = 'personal'
      )`,
    }),
    // Members can read their own membership and other members in their organization
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.joined_at is not null
      )`,
    }),
    // Owner and admins can update/delete memberships
    pgPolicy("enable update delete for organization admins", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
    }),
    pgPolicy("enable delete for organization admins", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
    }),
    // Members can update their own joinedAt timestamp when accepting invitation
    pgPolicy("enable update for accepting invitation", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = ${authUid}
      ) and joined_at is null`,
      withCheck: sql`exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = ${authUid}
      )`,
    }),
  ],
);

// Organization invitations table - manages pending invites with secure tokens
export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    email: varchar({ length: 320 }).notNull(),
    role: varchar({ length: 20 }).notNull().default("user"),
    token: varchar({ length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "organization_invitations_organization_id_fk",
    }).onDelete("cascade"),
    index("organization_invitations_organization_id_idx").on(
      table.organizationId,
    ),
    index("organization_invitations_token_idx").on(table.token),
    unique("organization_invitations_token_key").on(table.token),
    // Organization admins can manage invitations
    pgPolicy("enable all for organization admins", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
    }),
    // Anyone with the token can read the invitation (for accepting invites)
    pgPolicy("enable read by token", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);


// Relations for type-safe joins
export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    memberOrganization: one(organizations, {
      fields: [organizationMembers.memberOrganizationId],
      references: [organizations.id],
    }),
  }),
);
