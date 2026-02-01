type TLocation = {
  id: number;
  zipcode: string;
  name: string;
  lat: number;
  lng: number;
};

type TAdFromLobstr = {
  id: string;
  object: string;
  cluster: string;
  run: string;
  DPE: null | string;
  DPE_int: null | number;
  DPE_string: null | string;
  GES: null | string;
  GES_int: null | number;
  GES_string: null | string;
  ad_type: string;
  annonce_id: string;
  api_key: string;
  area: null | string;
  capacity: null | number;
  category_name: string;
  charges_included: null | boolean;
  city: string;
  continuous_top_ads: boolean;
  currency: string;
  custom_ref: null | string;
  department: string;
  description: string;
  detailed_time: null | string;
  details: {
    Marque: string;
    Permis: string;
    Couleur: string;
    Modèle: string;
    Sellerie: string;
    Carburant: string;
    Kilométrage: string;
    Équipements: string;
    "Puissance DIN": string;
    "Année modèle": string;
    "Nombre de portes": string;
    "Boîte de vitesse": string;
    Caractéristiques: string;
    "Puissance fiscale": string;
    "Type de véhicule": string;
    "Nombre de place(s)": string;
    "Date de première mise en circulation": string;
    "Date de fin de validité du contrôle technique": string;
    "État du véhicule": string;
    Cylindrée: string;
    Type: string;
  };
  district: null | string;
  expiration_date: string;
  filling_details: {
    phone: {
      filling_date: string;
    };
  };
  first_publication_date: string;
  floor: null | number;
  furnished: null | boolean;
  gallery: boolean;
  has_online_shop: boolean;
  has_option: boolean;
  has_phone: boolean;
  has_swimming_pool: null | boolean;
  is_active: null | boolean;
  is_boosted: boolean;
  is_deactivated: null | boolean;
  is_detailed: null | boolean;
  is_exclusive: null | boolean;
  is_mobile: null | boolean;
  land_plot_area: null | number;
  last_publication_date: string;
  lat: string;
  lng: string;
  mail: null | string;
  more_details: {
    fuel: string;
    brand: string;
    doors: string;
    model: string;
    seats: string;
    gearbox: string;
    mileage: string;
    regdate: string;
    is_import: string;
    horsepower: string;
    u_car_brand: string;
    u_car_model: string;
    vehicle_vsp: string;
    rating_count: string;
    rating_score: string;
    vehicle_type: string;
    issuance_date: string;
    vehicule_color: string;
    argus_object_id: string;
    horse_power_din: string;
    ad_warranty_type: string;
    vehicle_upholstery: string;
    profile_picture_url: string;
    vehicle_interior_specs: string;
    vehicle_specifications: string;
    licence_plate_available: string;
    vehicle_is_eligible_p2p: string;
    vehicle_technical_inspection_a: string;
    vehicle_history_report_public_url: string;
    old_price: string;
    car_price_max: string;
    car_price_min: string;
  };
  no_salesmen: boolean;
  online_shop_url: null | string;
  owner_name: string;
  owner_siren: null | string;
  owner_store_id: string;
  owner_type: string;
  phone: string;
  phone_from_user: null | string;
  photosup: boolean;
  picture: string;
  pictures: string;
  postal_code: string;
  price: number;
  price_per_square_meter: null | number;
  real_estate_type: null | string;
  ref: null | string;
  region: string;
  room_count: null | number;
  scraping_time: string;
  sleepingroom_count: null | number;
  source: string;
  square_metter_price: null | number;
  status_code: null | number;
  sub_toplist: boolean;
  title: string;
  urgent: boolean;
  url: string;
  user_id: string;
};

type TAd = {
  id: string;
  typeId: number;
  subtypeId: number | null;
  drivingLicenceId: number | null;
  gearBoxId: number | null;
  vehicleSeatsId: number | null;
  vehicleStateId: number | null;
  locationId: number;
  brandId: number | null;
  fuelId: number | null;
  originalAdId: string;
  url: string;
  title: string;
  description: string | null;
  picture: string | null;
  price: number;
  hasBeenReposted: boolean;
  hasBeenBoosted: boolean;
  isUrgent: boolean;
  modelYear: number | null;
  initialPublicationDate: string;
  lastPublicationDate: string;
  mileage: number | null;
  createdAt: string | null;
  priceHasDropped: boolean;
  favourite: boolean;
  priceMin: number | null;
  priceMax: number | null;
  isLowPrice: boolean;
  phoneNumber: string | null;
  ownerName: string;
  entryYear: number | null;
  hasPhone: boolean;
  equipments: string | null;
  otherSpecifications: string | null;
  technicalInspectionYear: number | null;
  model: string | null;
  acceptSalesmen: boolean;
};

type TAdWithRelations = Omit<
  TAd,
  | "typeId"
  | "subtypeId"
  | "drivingLicenceId"
  | "gearBoxId"
  | "vehicleSeatsId"
  | "vehicleStateId"
  | "locationId"
  | "brandId"
  | "fuelId"
> & {
  type?: {
    id: number;
    name: string;
  };
  location?: TLocation;
  subtype?: {
    id: number;
    adTypeId: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  drivingLicence?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  gearBox?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  vehicleSeats?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  vehicleState?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  brand?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  fuel?: {
    id: number;
    name: string;
    lbcValue: string | null;
    lobstrValue: string | null;
  } | null;
  contactedAds?: {
    id: string;
    adId: string;
    accountId: string;
    messageTypeId: number;
    createdAt: string;
  }[];
};

type TAdInsert = Omit<TAd, "id" | "createdAt">;

type TContactedAd = {
  id: string;
  adId: string;
  accountId: string;
  messageTypeId: string;
  createdAt: string;
};

type AutoSenderPreferencesType = {
  id: string;
  accountId: string;
  firstMessage: string;
  secondMessage: string;
  priceMin: number | null;
  priceMax: number | null;
  isLowPrice: boolean | null;
  hasBeenReposted: boolean | null;
  hasBeenBoosted: boolean | null;
  isUrgent: boolean | null;
  modelYearMin: number | null;
  priceHasDropped: boolean | null;
  isOld: boolean | null;
  modelYearMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
  autoSenderPreferencesBrands: {
    id: string;
    brandId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesDepartments: {
    id: string;
    departmentId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesDrivingLicences: {
    id: string;
    drivingLicenceId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesFuels: {
    id: string;
    fuelId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesVehicleStates?: {
    id: string;
    vehicleStateId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesVehicleSubtypes: {
    id: string;
    vehicleSubtypeId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesVehicleTypes: {
    id: string;
    vehicleTypeId: number;
    autoSenderPreferencesId: string;
  }[];
  autoSenderPreferencesZipcodes: {
    id: string;
    zipcodeId: number;
    autoSenderPreferencesId: string;
  }[];
};

type AutoSenderPreferencesTypeWithoutRelations = Omit<
  AutoSenderPreferencesType,
  | "autoSenderPreferencesBrands"
  | "autoSenderPreferencesDepartments"
  | "autoSenderPreferencesDrivingLicences"
  | "autoSenderPreferencesFuels"
  | "autoSenderPreferencesVehicleStates"
  | "autoSenderPreferencesVehicleSubtypes"
  | "autoSenderPreferencesVehicleTypes"
  | "autoSenderPreferencesZipcodes"
>;

type GeneralParametersType = {
  id: number;
  leboncoinMaxPages: number;
  leboncoinMaxAdsPerPage: number;
  lastPageScraped: number;
  newMessagesNumberLimit: number;
  followUpMessagesNumberLimit: number;
  defaultPhoneNumber: string;
  durationBetweenTwoSms: number;
  adsNumberPerPage: number;
};

type TextVariableType = {
  name: string;
  id: number;
  keyToUse: string | null;
};

type TSubscription =
  | void
  | {
      active: boolean;
      id: string;
      accountId: string | null;
      updatedAt: string;
      createdAt: string;
      billingProvider: "stripe" | "lemon-squeezy" | "paddle";
      currency: string;
      billingCustomerId: number;
      status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused";
      cancelAtPeriodEnd: boolean;
      periodStartsAt: string;
      periodEndsAt: string;
      trialStartsAt: string | null;
      trialEndsAt: string | null;
    }
  | undefined;

type TAdReferenceData = {
  adTypes: Map<string, number>;
  adSubTypes: Map<string, number>;
  brands: Map<string, number>;
  zipcodes: Map<string, number>;
  gearBoxes: Map<string, number>;
  drivingLicences: Map<string, number>;
  fuels: Map<string, number>;
  vehicleSeats: Map<string, number>;
  vehicleStates: Map<string, number>;
};

export type {
  AutoSenderPreferencesType,
  AutoSenderPreferencesTypeWithoutRelations,
  GeneralParametersType,
  TAd,
  TAdFromLobstr,
  TAdInsert,
  TAdReferenceData,
  TAdWithRelations,
  TContactedAd,
  TextVariableType,
  TLocation,
  TSubscription,
};
