/**
 * Hunt Configuration - SINGLE SOURCE OF TRUTH
 * All hunt-related enums, types, and configs
 */

export const HUNT_STATUS_DEFINITIONS = [
  {
    key: "ACTIVE",
    value: "active",
    label: "Active",
    description: "Recherche en cours",
    icon: "play",
    color: "green",
  },
  {
    key: "PAUSED",
    value: "paused",
    label: "En pause",
    description: "Recherche mise en pause",
    icon: "pause",
    color: "orange",
  },
] as const;

// Enum-like constant access (e.g., EHuntStatus.ACTIVE)
export const EHuntStatus = Object.fromEntries(
  HUNT_STATUS_DEFINITIONS.map((status) => [status.key, status.value]),
) as {
  [K in (typeof HUNT_STATUS_DEFINITIONS)[number]["key"]]: Extract<
    (typeof HUNT_STATUS_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type THuntStatus = (typeof HUNT_STATUS_DEFINITIONS)[number]["value"];

export const HUNT_STATUS_VALUES = HUNT_STATUS_DEFINITIONS.map((s) => s.value);

export const getHuntStatusConfig = (status: THuntStatus) => {
  const config = HUNT_STATUS_DEFINITIONS.find((s) => s.value === status);
  if (!config) throw new Error(`Invalid hunt status: ${status}`);
  return config;
};

export const getHuntStatusLabel = (status: THuntStatus): string => {
  return getHuntStatusConfig(status).label;
};
