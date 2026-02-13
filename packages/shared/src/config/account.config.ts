/**
 * Account Configuration - SINGLE SOURCE OF TRUTH
 * All account-related enums, types, and configs
 */

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export const ACCOUNT_TYPE_DEFINITIONS = [
  {
    key: "PERSONAL",
    value: "personal",
    label: "Personnel",
    description: "Compte personnel",
    icon: "user",
    color: "blue",
  },
  {
    key: "TEAM",
    value: "team",
    label: "Équipe",
    description: "Compte d'équipe",
    icon: "users",
    color: "purple",
  },
] as const;

// Enum-like constant access (e.g., EAccountType.PERSONAL)
export const EAccountType = Object.fromEntries(
  ACCOUNT_TYPE_DEFINITIONS.map((type) => [type.key, type.value]),
) as {
  [K in (typeof ACCOUNT_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ACCOUNT_TYPE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TAccountType = (typeof ACCOUNT_TYPE_DEFINITIONS)[number]["value"];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPE_DEFINITIONS.map(
  (t) => t.value,
) as [TAccountType, ...TAccountType[]];

export const getAccountTypeConfig = (type: TAccountType) => {
  const config = ACCOUNT_TYPE_DEFINITIONS.find((t) => t.value === type);
  if (!config) throw new Error(`Invalid account type: ${type}`);
  return config;
};

export const getAccountTypeLabel = (type: TAccountType): string => {
  return getAccountTypeConfig(type).label;
};

// ============================================================================
// ROLES
// ============================================================================

export const ROLE_DEFINITIONS = [
  {
    key: "OWNER",
    value: "owner",
    label: "Propriétaire",
    description: "Propriétaire du compte avec tous les droits",
    permissions: ["all"],
    color: "purple",
  },
  {
    key: "ADMIN",
    value: "admin",
    label: "Administrateur",
    description: "Administrateur avec droits étendus",
    permissions: ["manage_users", "manage_hunts", "manage_credits"],
    color: "blue",
  },
  {
    key: "MEMBER",
    value: "member",
    label: "Membre",
    description: "Membre avec droits limités",
    permissions: ["view_hunts", "view_leads"],
    color: "gray",
  },
] as const;

// Enum-like constant access (e.g., ERole.OWNER)
export const ERole = Object.fromEntries(
  ROLE_DEFINITIONS.map((role) => [role.key, role.value]),
) as {
  [K in (typeof ROLE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ROLE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TRole = (typeof ROLE_DEFINITIONS)[number]["value"];

export const ROLE_VALUES = ROLE_DEFINITIONS.map((r) => r.value) as [
  TRole,
  ...TRole[],
];

export const getRoleConfig = (role: TRole) => {
  const config = ROLE_DEFINITIONS.find((r) => r.value === role);
  if (!config) throw new Error(`Invalid role: ${role}`);
  return config;
};

export const getRoleLabel = (role: TRole): string => {
  return getRoleConfig(role).label;
};
