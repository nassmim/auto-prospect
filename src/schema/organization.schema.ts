import { EOrganizationType, ERole } from "@/constants/enums";
import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import {
  foreignKey,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Organization settings type for JSONB field
export type OrganizationSettings = {
  allowReassignment?: boolean;
  restrictVisibility?: boolean;
  dailyReset?: boolean;
  ignorePhonesVisible?: boolean;
};

// Types of organizations
export const organizationType = pgEnum(
  "organization_type",
  Object.values(EOrganizationType) as [string, ...string[]],
);

// Role enum type for organization members
export const role = pgEnum(
  "role",
  Object.values(ERole) as [string, ...string[]],
);

// Organizations table - will have either just one member or several
export const organizations = pgTable(
  "organizations",
  {
    id: uuid().primaryKey().defaultRandom(),
    authUserId: uuid("auth_user_id").notNull(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 320 }).notNull(),
    pictureUrl: varchar("picture_url", { length: 1000 }),
    phoneNumber: varchar("phone_number", { length: 14 }),
    // Organization type discriminator
    type: organizationType("type")
      .notNull()
      .default(EOrganizationType.PERSONAL),
    settings: jsonb().$type<OrganizationSettings>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.authUserId],
      foreignColumns: [authUsers.id],
      name: "auth_user_id_fk",
    }).onDelete("set null"),
    unique("auth_user_id_unique").on(table.authUserId),
    pgPolicy("enable update for organization owners", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id 
        -- OR
        -- exists (
        --   select 1 from organization_members om
        --   join organizations o on o.id = om.member_organization_id
        --   where om.organization_id = ${table.id}
        --   and o.auth_user_id = ${authUid}
        --   and om.role = ${ERole.ADMIN}
        --   and om.joined_at is not null
        )
      `,
      withCheck: sql`
        ${authUid} = auth_user_id 
        -- OR
        -- exists (
        --   select 1 from organization_members om
        --   join organizations o on o.id = om.member_organization_id
        --   where om.organization_id = ${table.id}
        --   and o.auth_user_id = ${authUid}
        --   and om.role = ${ERole.ADMIN}
        --   and om.joined_at is not null
        )
      `,
    }),
    // Users can delete their own org
    pgPolicy("enable delete for organization owners", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`
        ${authUid} = ${table.authUserId} 
      `,
    }),
    // Members can read data for orgs they belong to
    pgPolicy("enable read for organization owners", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`
        ${authUid} = auth_user_id 
        -- OR
        -- exists (
        --   select 1 from organization_members om
        --   where om.organization_id = ${table.id}
        --   and om.auth_user_id = ${authUid}
        --   and om.joined_at is not null
        -- )
      `,
    }),
  ],
);
export type TOrganization = InferSelectModel<typeof organizations>;

// Organization members table - they are not users, they are only data for now.
// We'll implement team-based features later
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    // authUserId: uuid("auth_user_id").notNull(),
    name: text().notNull(),
    // role: role().notNull().default(ERole.MEMBER),
    // invitedAt: timestamp("invited_at", { withTimezone: true })
    //   .notNull()
    //   .defaultNow(),
    // joinedAt: timestamp("joined_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "organization_id_fk",
    }).onDelete("cascade"),
    unique("organisation_id_member_name_unique").on(
      table.organizationId,
      table.name,
    ),
    // foreignKey({
    //   columns: [table.authUserId],
    //   foreignColumns: [authUsers.id],
    //   name: "auth_user_id_fk",
    // }).onDelete("cascade"),
    // unique("organization_member_unique").on(table.authUserId),
    pgPolicy("enable all for organization owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from organizations o
        where o.id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from organizations o
        where o.id = ${table.organizationId}
        and o.auth_user_id = ${authUid}
      )`,
    }),
    // // Members can read their own membership and other members in their organization
    // pgPolicy("enable read for organization members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     exists (
    //       select 1 from organization_members om
    //       where om.organization_id = ${table.organizationId}
    //       and om.auth_user_id = ${authUid}
    //       and om.joined_at is not null
    //     )z
    //   )`,
    // }),
    // // Owner and admins can update memberships
    // pgPolicy("enable update for organization owner and admins", {
    //   as: "permissive",
    //   for: "update",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and o.auth_user_id = ${authUid}
    //     and om.role in ('owner', 'admin')
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //       select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and o.auth_user_id = ${authUid}
    //     and om.role in ('owner', 'admin')
    //     and om.joined_at is not null
    //   )`,
    // }),
    // pgPolicy("enable delete for organization owners and admins", {
    //   as: "permissive",
    //   for: "delete",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organization_members om
    //     where om.organization_id = ${table.organizationId}
    //     and o.auth_user_id = ${authUid}
    //     and om.role in ('owner', 'admin')
    //     and om.joined_at is not null
    //   )`,
    // }),
    // // Members can update their own joinedAt timestamp when accepting invitation
    // pgPolicy("enable update for accepting invitation", {
    //   as: "permissive",
    //   for: "update",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from organizations o
    //     where o.id = ${table.organizationId}
    //     and o.auth_user_id = ${authUid}
    //   ) and joined_at is null`,
    //   withCheck: sql`exists (
    //     select 1 from organizations o
    //     where o.id = ${table.organizationId}
    //     and o.auth_user_id = ${authUid}
    //   )`,
    // }),
  ],
);
export type TOrganizationMemberInsert = InferInsertModel<
  typeof organizationMembers
>;
export type TOrganizationMember = InferSelectModel<typeof organizationMembers>;

// // Organization invitations table - manages pending invites with secure tokens
// export const organizationInvitations = pgTable(
//   "organization_invitations",
//   {
//     id: uuid()
//       .primaryKey()
//       .defaultRandom(),
//     organizationId: uuid("organization_id").notNull(),
//     email: varchar({ length: 320 }).notNull(),
//     role: varchar({ length: 20 }).notNull().default("user"),
//     token: varchar({ length: 64 }).notNull().unique(),
//     expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true })
//       .notNull()
//       .default(sql`now()`),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.organizationId],
//       foreignColumns: [organizations.id],
//       name: "organization_invitations_organization_id_fk",
//     }).onDelete("cascade"),
//     index("organization_invitations_organization_id_idx").on(
//       table.organizationId,
//     ),
//     index("organization_invitations_token_idx").on(table.token),
//     unique("organization_invitations_token_key").on(table.token),
//     // Organization admins can manage invitations
//     pgPolicy("enable all for organization admins", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`exists (
//         select 1 from organization_members om
//         join organizations o on o.id = om.member_organization_id
//         where om.organization_id = ${table.organizationId}
//         and o.auth_user_id = ${authUid}
//         and om.role in ('owner', 'admin')
//         and om.joined_at is not null
//       )`,
//       withCheck: sql`exists (
//         select 1 from organization_members om
//         join organizations o on o.id = om.member_organization_id
//         where om.organization_id = ${table.organizationId}
//         and o.auth_user_id = ${authUid}
//         and om.role in ('owner', 'admin')
//         and om.joined_at is not null
//       )`,
//     }),
//     // Anyone with the token can read the invitation (for accepting invites)
//     pgPolicy("enable read by token", {
//       as: "permissive",
//       for: "select",
//       to: authenticatedRole,
//       using: sql`true`,
//     }),
//   ],
// );
// export type TOrganizationInvitationInsert = InferInsertModel<
//   typeof organizationInvitations
// >;
// export type TOrganizationInvitation = InferSelectModel<
//   typeof organizationInvitations
// >;

// Relations for type-safe joins
export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    // authUser: one(organizations, {
    //   fields: [organizationMembers.authUserId],
    //   references: [authUsers.id],
    // }),
  }),
);
