/**
 * Platform Configuration - SINGLE SOURCE OF TRUTH
 * Platform-related enums, types, and configs
 */

const PLATFORM_DEFINITIONS = [
  {
    key: "LOBSTR",
    value: "lobstrValue",
    label: "LobstrValue",
    description: "Plateforme LobstrValue",
    icon: "globe",
    color: "blue",
  },
] as const;

export const PLATFORM_CONFIG = Object.fromEntries(
  PLATFORM_DEFINITIONS.map((platform) => [platform.key, platform]),
) as {
  [K in (typeof PLATFORM_DEFINITIONS)[number]["key"]]: Extract<
    (typeof PLATFORM_DEFINITIONS)[number],
    { key: K }
  >;
};

export const EPlatformValue = Object.fromEntries(
  PLATFORM_DEFINITIONS.map((platform) => [platform.key, platform.value]),
) as {
  [K in (typeof PLATFORM_DEFINITIONS)[number]["key"]]: Extract<
    (typeof PLATFORM_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TPlatformValue = (typeof PLATFORM_DEFINITIONS)[number]["value"];

export const PLATFORMS = PLATFORM_DEFINITIONS;
export const PLATFORM_VALUES = PLATFORM_DEFINITIONS.map((p) => p.value);

export const getPlatformConfig = (platform: TPlatformValue) => {
  const config = PLATFORM_DEFINITIONS.find((p) => p.value === platform);
  if (!config) throw new Error(`Invalid platform: ${platform}`);
  return config;
};

export const getPlatformLabel = (platform: TPlatformValue): string => {
  return getPlatformConfig(platform).label;
};
