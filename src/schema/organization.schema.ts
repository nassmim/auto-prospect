import { sql } from "drizzle-orm";
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
import { accounts } from "./account.schema";

// Organization settings type for JSONB field
export type OrganizationSettings = {
  allowReassignment?: boolean;
  restrictVisibility?: boolean;
  dailyReset?: boolean;
  ignorePhonesVisible?: boolean;
};

// Organizations table - top-level entity for multi-tenant team management
export const organizations = pgTable(
  "organizations",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    name: varchar({ length: 255 }).notNull(),
    ownerId: uuid("owner_id").notNull(),
    settings: jsonb().$type<OrganizationSettings>().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [accounts.id],
      name: "organizations_owner_id_fk",
    }).onDelete("cascade"),
    index("organizations_owner_id_idx").on(table.ownerId),
    // Authenticated users can create organizations (for personal org during signup)
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = owner_id`,
    }),
    // Owner can update/delete their organization
    pgPolicy("enable update delete for organization owner", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = owner_id`,
      withCheck: sql`${authUid} = owner_id`,
    }),
    pgPolicy("enable delete for organization owner", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = owner_id`,
    }),
    // Members can read organizations they belong to
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members
        where organization_members.organization_id = ${table.id}
        and organization_members.account_id = ${authUid}
        and organization_members.joined_at is not null
      )`,
    }),
  ],
);

// Role enum type for organization members
export const organizationRoles = ["owner", "admin", "user"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];

// Organization members table - links accounts to organizations with roles
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id").notNull(),
    accountId: uuid("account_id").notNull(),
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
      columns: [table.accountId],
      foreignColumns: [accounts.id],
      name: "organization_members_account_id_fk",
    }).onDelete("cascade"),
    unique("organization_members_org_account_key").on(
      table.organizationId,
      table.accountId,
    ),
    index("organization_members_organization_id_idx").on(table.organizationId),
    index("organization_members_account_id_idx").on(table.accountId),
    // Authenticated users can insert themselves as members (for personal org during signup)
    pgPolicy("enable insert for authenticated users", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = account_id`,
    }),
    // Members can read their own membership and other members in their organization
    pgPolicy("enable read for organization members", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
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
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
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
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
    }),
    // Members can update their own joinedAt timestamp when accepting invitation
    pgPolicy("enable update for accepting invitation", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = account_id and joined_at is null`,
      withCheck: sql`${authUid} = account_id`,
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
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )`,
      withCheck: sql`exists (
        select 1 from organization_members om
        where om.organization_id = ${table.organizationId}
        and om.account_id = ${authUid}
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
