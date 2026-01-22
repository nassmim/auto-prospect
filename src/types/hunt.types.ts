import { TLocation } from "@/types/ad.types";

type TFilters = {
  id: string;
  organizationId: string;
  adTypeId: number;
  locationId: number;
  radiusInKm: number;
  priceMin: number;
  priceMax: number | null;
  isLowPrice: boolean;
  hasBeenReposted: boolean;
  hasBeenBoosted: boolean;
  isUrgent: boolean;
  modelYearMin: number;
  priceHasDropped: boolean;
  modelYearMax: number | null;
  mileageMin: number;
  mileageMax: number | null;
};

type THuntWithRelations = Omit<
  TFilters,
  "typeId" | "subtypeId" | "locationId" | "brandId"
> & {
  type?: {
    id: string;
    adTypeId: number;
    baseFilterId: string;
  };
  location: TLocation;
  brands: {
    id: string;
    brandId: number;
    baseFilterId: string;
  }[];
  subTypes: {
    id: string;
    subTypeId: number;
    baseFilterId: string;
  }[];
};

export type { TFilters, THuntWithRelations };
