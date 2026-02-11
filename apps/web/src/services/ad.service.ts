import type { TContactedAd, THunt } from "@auto-prospect/db";

/**
 * Gets ads that already received a message from a specific user
 */
export const getAdsContactedByUser = async (
  accountId: string,
): Promise<Pick<TContactedAd, "adId">[]> => {
  // Call endpoint
};

export const getMatchingAds = async (
  robot: THunt,
  {
    contactedAdsIds = [],
    excludeContactedAds = true,
  }: {
    contactedAdsIds?: TContactedAd["adId"][];
    excludeContactedAds?: boolean;
  } = {},
): Promise<TAd[]> => {
  // call endpoint
};
