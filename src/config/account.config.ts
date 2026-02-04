/**
 * Account Configuration - SINGLE SOURCE OF TRUTH
 * All account-related enums, types, and configs
 */

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

const ACCOUNT_TYPE_DEFINITIONS = [
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

export const ACCOUNT_TYPE_CONFIG = Object.fromEntries(
  ACCOUNT_TYPE_DEFINITIONS.map((type) => [type.key, type]),
) as {
  [K in (typeof ACCOUNT_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ACCOUNT_TYPE_DEFINITIONS)[number],
    { key: K }
  >;
};

export const EAccountType = Object.fromEntries(
  ACCOUNT_TYPE_DEFINITIONS.map((type) => [type.key, type.value]),
) as {
  [K in (typeof ACCOUNT_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ACCOUNT_TYPE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TAccountType = (typeof ACCOUNT_TYPE_DEFINITIONS)[number]["value"];

export const ACCOUNT_TYPES = ACCOUNT_TYPE_DEFINITIONS;
export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPE_DEFINITIONS.map((t) => t.value);

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

const ROLE_DEFINITIONS = [
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

export const ROLE_CONFIG = Object.fromEntries(
  ROLE_DEFINITIONS.map((role) => [role.key, role]),
) as {
  [K in (typeof ROLE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ROLE_DEFINITIONS)[number],
    { key: K }
  >;
};

export const ERole = Object.fromEntries(
  ROLE_DEFINITIONS.map((role) => [role.key, role.value]),
) as {
  [K in (typeof ROLE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof ROLE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TRole = (typeof ROLE_DEFINITIONS)[number]["value"];

export const ROLES = ROLE_DEFINITIONS;
export const ROLE_VALUES = ROLE_DEFINITIONS.map((r) => r.value);

export const getRoleConfig = (role: TRole) => {
  const config = ROLE_DEFINITIONS.find((r) => r.value === role);
  if (!config) throw new Error(`Invalid role: ${role}`);
  return config;
};

export const getRoleLabel = (role: TRole): string => {
  return getRoleConfig(role).label;
};
