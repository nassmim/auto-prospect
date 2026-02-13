export const HUNT_WITH_RELATIONS = {
  location: true,
  brands: {
    with: {
      brand: true,
    },
  },
  subTypes: {
    with: {
      subType: true,
    },
  },
} as const;
