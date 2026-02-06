/**
 * Team member with account relation - inferred from service return type
 * This type represents what getTeamMembers() actually returns
 */
export type TTeamMembersWithAccount = Awaited<
  ReturnType<typeof import("@/services/team.service").getTeamMembers>
>;
