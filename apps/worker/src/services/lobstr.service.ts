import {
  ads as adsTable,
  getDBAdminClient,
  getTableColumns,
  sql,
  TAdInsert,
  TAdReferenceData,
} from "@auto-prospect/db";
import { parsePhoneNumberWithError } from "@auto-prospect/shared";
import { customParseInt } from "../utils/general.utils";
import { fetchAllReferenceData } from "./ad.service";
import { sendAlertToAdmin } from "./general.service";

// Platform value field name for Lobstr
const LOBSTR_PLATFORM_FIELD = "lobstrValue" as const;

// Get all columns except the ones we don't want to update on conflict
const allColumns = getTableColumns(adsTable);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { id, createdAt, originalAdId, ...columnsToUpdate } = allColumns;

// Use the actual database column names (snake_case) from the table schema
const setAdUpdateOnConflict = Object.fromEntries(
  Object.entries(columnsToUpdate).map(([key, column]) => [
    key,
    sql`excluded.${sql.identifier(column.name)}`,
  ]),
);

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

/**
 * Handles Lobstr webhook processing
 * This webhook sends us the results (ads) from a run
 */
export const handleLobstrWebhook = async (runId: string): Promise<void> => {
  try {
    await saveAdsFromLobstr(runId);
  } catch (error) {
    await sendAlertToAdmin(
      `Error while fetching ads from Lobstr run, id: ${runId}, error: ${error}`,
    ).catch(() => {});
  }
};

/**
 * Gets the ads from the lobstr API and saves them in the db
 * runId is the id sent by lobstr
 */
const saveAdsFromLobstr = async (runId: string): Promise<void> => {
  const db = getDBAdminClient();

  const fetchedResults = await getResultsFromRun(runId);

  const results = (await fetchedResults.json()) as { data: TAdFromLobstr[] };
  const ads: TAdFromLobstr[] = results.data;

  // Fetch all reference data so that we know which fields to use given
  // that the ads are coming from Lobstr
  const referenceData = await fetchAllReferenceData(db, LOBSTR_PLATFORM_FIELD);

  // for each ad, we map the platform values with the appropriate values that our db accepts
  const getAdsData = ads.map((ad) => getAdData(ad, referenceData));

  const adsToPersistPromise = await Promise.allSettled(getAdsData);
  // This step to ensure we insert only valid objects to the db query
  const adsToPersist = adsToPersistPromise.reduce<TAdInsert[]>(
    (listOfAds, adPromise) => {
      if (adPromise.status === "fulfilled" && !!adPromise.value?.typeId) {
        listOfAds = listOfAds.concat(adPromise.value);
      }
      return listOfAds;
    },
    [],
  );

  // Insertion with update - if the id of the ad and the url
  // (we use the url as well as a provider could have same id for different categories)

  await db
    .insert(adsTable)
    .values(adsToPersist)
    .onConflictDoUpdate({
      target: [adsTable.originalAdId],
      set: setAdUpdateOnConflict,
    })
    .returning();
};

// Gets the results from lobstr run using their API
const getResultsFromRun = async (runId: string): Promise<Response> => {
  const fetchedResults = await fetch(
    `https://api.lobstr.io/v1/results?cluster=${process.env.LOBSTR_CLUSTER}&run=${runId}&page=1&page_size=10000`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${process.env.LOBSTR_API_KEY}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );

  return fetchedResults;
};

/**
 * Gets from the ad the data that will be persisted in the db
 */
const getAdData = async (
  ad: TAdFromLobstr,
  referenceData: TAdReferenceData,
): Promise<TAdInsert> => {
  const { details: adDetails, more_details: adMoreDetails } = ad;

  let isLowPrice = false;
  const priceMax = customParseInt(adMoreDetails.car_price_max);
  const priceMin = customParseInt(adMoreDetails.car_price_min);
  if (priceMax && priceMin) {
    const priceAmplitude = priceMax - priceMin;
    const thirdOfPriceAmplitude = priceAmplitude / 3;
    isLowPrice = priceMin + thirdOfPriceAmplitude > ad.price;
  }

  const adData: Partial<TAdInsert> = {
    originalAdId: ad.annonce_id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    url: ad.url,
    hasPhone: ad.phone ? true : false,
    phoneNumber: ad.phone
      ? parsePhoneNumberWithError(ad.phone, "FR")?.number
      : null,
    picture: ad.picture,
    pictures: ad.pictures.split(","),
    initialPublicationDate: new Date(ad.first_publication_date).toDateString(),
    lastPublicationDate: new Date(ad.last_publication_date).toDateString(),
    ownerName: ad.owner_name,
    hasBeenBoosted: ad.is_boosted,
    isUrgent: ad.urgent,
    modelYear: customParseInt(adDetails["Année modèle"]),
    model: adMoreDetails.model,
    entryYear: customParseInt(
      adDetails["Date de première mise en circulation"].slice(-4),
    ),
    hasBeenReposted: ad.last_publication_date
      ? ad.first_publication_date !== ad.last_publication_date
      : false,
    mileage: customParseInt(adDetails["Kilométrage"]),
    priceHasDropped: adMoreDetails.old_price
      ? ad.price < parseInt(adMoreDetails.old_price)
      : false,
    priceMin,
    priceMax,
    isLowPrice,
    equipments: adMoreDetails.vehicle_interior_specs || null,
    otherSpecifications: adMoreDetails.vehicle_specifications,
    technicalInspectionYear: customParseInt(
      adDetails["Date de fin de validité du contrôle technique"],
    ),
    acceptSalesmen: !ad.no_salesmen,
  };

  // lookups to get the record id in our db associated to this lobstr value
  adData.typeId = referenceData.adTypes.get(ad.category_name) || 1;
  adData.brandId = referenceData.brands.get(adDetails["Marque"]) || null;
  adData.locationId = referenceData.zipcodes.get(ad.postal_code) || 1;
  adData.gearBoxId =
    referenceData.gearBoxes.get(adDetails["Boîte de vitesse"]) || null;
  adData.drivingLicenceId =
    referenceData.drivingLicences.get(adDetails["Permis"]) || 1;
  adData.fuelId = referenceData.fuels.get(adMoreDetails.fuel) || null;
  adData.vehicleSeatsId =
    referenceData.vehicleSeats.get(adDetails["Nombre de place(s)"]) || null;
  adData.vehicleStateId =
    referenceData.vehicleStates.get(adDetails["État du véhicule"]) || 2;
  adData.subtypeId =
    referenceData.adSubTypes.get(adDetails["Type de véhicule"]) || null;

  return adData as TAdInsert;
};
