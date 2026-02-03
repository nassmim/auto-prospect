import { ERole } from "@/constants/enums";
import { accounts } from "@/schema/account.schema";
import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import {
  foreignKey,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

// Role enum type for account members
export const role = pgEnum(
  "role",
  Object.values(ERole) as [string, ...string[]],
);

// account members table - they are not users, they are only data for now.
// We'll implement team-based features later
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull(),
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
      columns: [table.accountId],
      foreignColumns: [accounts.id],
      name: "account_id_fk",
    }).onDelete("cascade"),
    unique("organisation_id_member_name_unique").on(
      table.accountId,
      table.name,
    ),
    // foreignKey({
    //   columns: [table.authUserId],
    //   foreignColumns: [authUsers.id],
    //   name: "auth_user_id_fk",
    // }).onDelete("cascade"),
    // unique("account_member_unique").on(table.authUserId),
    pgPolicy("enable all for account owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`${table.accountId} = ${authUid}`,
      withCheck: sql`${table.accountId} = ${authUid}`,
    }),
    // // Members can read their own membership and other members in their account
    // pgPolicy("enable read for account members", {
    //   as: "permissive",
    //   for: "select",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     exists (
    //       select 1 from team_members om
    //       where om.account_id = ${table.accountId}
    //       and om.auth_user_id = ${authUid}
    //       and om.joined_at is not null
    //     )z
    //   )`,
    // }),
    // // Owner and admins can update memberships
    // pgPolicy("enable update for account owner and admins", {
    //   as: "permissive",
    //   for: "update",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and o.auth_user_id = ${authUid}
    //     and om.role in ('owner', 'admin')
    //     and om.joined_at is not null
    //   )`,
    //   withCheck: sql`exists (
    //       select 1 from team_members om
    //     where om.account_id = ${table.accountId}
    //     and o.auth_user_id = ${authUid}
    //     and om.role in ('owner', 'admin')
    //     and om.joined_at is not null
    //   )`,
    // }),
    // pgPolicy("enable delete for account owners and admins", {
    //   as: "permissive",
    //   for: "delete",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //     select 1 from team_members om
    //     where om.account_id = ${table.accountId}
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
    //     select 1 from accounts o
    //     where o.id = ${table.accountId}
    //     and o.auth_user_id = ${authUid}
    //   ) and joined_at is null`,
    //   withCheck: sql`exists (
    //     select 1 from accounts o
    //     where o.id = ${table.accountId}
    //     and o.auth_user_id = ${authUid}
    //   )`,
    // }),
  ],
);
export type TTeamMemberInsert = InferInsertModel<typeof teamMembers>;
export type TTeamMember = InferSelectModel<typeof teamMembers>;

// // account invitations table - manages pending invites with secure tokens
// export const accountInvitations = pgTable(
//   "account_invitations",
//   {
//     id: uuid()
//       .primaryKey()
//       .defaultRandom(),
//     accountId: uuid("account_id").notNull(),
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
//       columns: [table.accountId],
//       foreignColumns: [accounts.id],
//       name: "account_invitations_account_id_fk",
//     }).onDelete("cascade"),
//     index("account_invitations_account_id_idx").on(
//       table.accountId,
//     ),
//     index("account_invitations_token_idx").on(table.token),
//     unique("account_invitations_token_key").on(table.token),
//     // account admins can manage invitations
//     pgPolicy("enable all for account admins", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`exists (
//         select 1 from team_members om
//         join accounts o on o.id = om.member_account_id
//         where om.account_id = ${table.accountId}
//         and o.auth_user_id = ${authUid}
//         and om.role in ('owner', 'admin')
//         and om.joined_at is not null
//       )`,
//       withCheck: sql`exists (
//         select 1 from team_members om
//         join accounts o on o.id = om.member_account_id
//         where om.account_id = ${table.accountId}
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
// export type TaccountInvitationInsert = InferInsertModel<
//   typeof accountInvitations
// >;
// export type TaccountInvitation = InferSelectModel<
//   typeof accountInvitations
// >;

// Relations for type-safe joins
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  account: one(accounts, {
    fields: [teamMembers.accountId],
    references: [accounts.id],
  }),
  // authUser: one(accounts, {
  //   fields: [teamMembers.authUserId],
  //   references: [authUsers.id],
  // }),
}));
