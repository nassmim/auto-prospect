type TBaseFilters = {
  id: string;
  accountId: string;
  adTypeId: string;
  zipcodeId: string;
  latCenter: number;
  lngCenter: number;
  radius: number;
  priceMin: number | null;
  priceMax: number | null;
  isLowPrice: boolean | null;
  hasBeenReposted: boolean | null;
  hasBeenBoosted: boolean | null;
  isUrgent: boolean | null;
  modelYearMin: number | null;
  priceHasDropped: boolean | null;
  modelYearMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
};

type TBaseFiltersWithRelations = TBaseFilters & {
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

type TFilters = TBaseFiltersWithRelations & {
  type: {
    id: string;
    adTypeId: number;
    baseFilterId: string;
  };
  zipcode: {
    id: string;
    zipcodeId: number;
    baseFilterId: string;
  };
};

export type { TBaseFilters, TBaseFiltersWithRelations, TFilters };
