"use server";

import { DB_COLUMS_TO_UPDATE } from "@/constants/ads.constants";
import { EPlatformValue } from "@/constants/enums";
import {
  createDrizzleSupabaseClient,
  TDBClient,
  TDBModel,
  TDBQuery,
} from "@/lib/drizzle/dbClient";
import {
  adSubTypes,
  adTypes,
  brands,
  drivingLicences,
  fuels,
  gearBoxes,
  locations,
  vehicleSeats,
  vehicleStates,
} from "@/schema";
import {
  TAd,
  TAdReferenceData,
  TContactedAd,
  TLocation,
} from "@/types/ad.types";
import { TFiltersWithRelations } from "@/types/prospecting.types";
import { BinaryOperator, sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

export const setAdUpdateOnConflict = Object.fromEntries(
  DB_COLUMS_TO_UPDATE.map((col) => [col, sql.raw(`excluded.${col}`)]),
);

/**
 * Gets the database record id of a specific value given by the platform
 * where the ad has been retrieved
 */
export const getDataId = async ({
  modelName,
  platformValue,
  field = "lobstrValue",
  defaultValue = null,
  dbClient,
}: {
  modelName: TDBModel;
  platformValue: string | undefined | null;
  field: string;
  defaultValue?: number | null;
  dbClient?: TDBClient;
}): Promise<number | null> => {
  if (!platformValue) return defaultValue;

  const client = dbClient || (await createDrizzleSupabaseClient());

  // @ts-expect-error - Dynamic model access creates complex union types that TS cannot narrow
  const dataFetched = await client.admin.query[modelName].findFirst({
    where: (
      table: { [key: string]: PgColumn },
      { eq }: { eq: BinaryOperator },
    ) => eq(table[field as keyof typeof table], platformValue),
  });

  return dataFetched?.id ?? null;
};

/**
 * Gets the right fields depending on the platform from which the ads have been retrieved
 * Enables to then do a lookup and know which value from our db must be associated to the ad
 */
export const fetchAllReferenceData = async (
  dbClient: TDBClient,
  platformField: EPlatformValue,
): Promise<TAdReferenceData> => {
  const [
    adTypesData,
    adSubTypesData,
    brandsData,
    zipcodesData,
    gearBoxesData,
    drivingLicencesData,
    fuelsData,
    vehicleSeatsData,
    vehicleStatesData,
  ] = await Promise.all([
    dbClient.admin.select().from(adTypes),
    dbClient.admin.select().from(adSubTypes),
    dbClient.admin.select().from(brands),
    dbClient.admin.select().from(locations),
    dbClient.admin.select().from(gearBoxes),
    dbClient.admin.select().from(drivingLicences),
    dbClient.admin.select().from(fuels),
    dbClient.admin.select().from(vehicleSeats),
    dbClient.admin.select().from(vehicleStates),
  ]);

  // Returns a map object that will facilitate the lookups when needed
  return {
    adTypes: new Map(
      adTypesData.map((item) => [item[platformField] || "", item.id]),
    ),
    adSubTypes: new Map(
      adSubTypesData.map((item) => [item[platformField] || "", item.id]),
    ),
    brands: new Map(
      brandsData.map((item) => [item[platformField] || "", item.id]),
    ),
    zipcodes: new Map(zipcodesData.map((item) => [item.zipcode, item.id])),
    gearBoxes: new Map(
      gearBoxesData.map((item) => [item[platformField] || "", item.id]),
    ),
    drivingLicences: new Map(
      drivingLicencesData.map((item) => [item[platformField] || "", item.id]),
    ),
    fuels: new Map(
      fuelsData.map((item) => [item[platformField] || "", item.id]),
    ),
    vehicleSeats: new Map(
      vehicleSeatsData.map((item) => [item[platformField] || "", item.id]),
    ),
    vehicleStates: new Map(
      vehicleStatesData.map((item) => [item[platformField] || "", item.id]),
    ),
  };
};

/**
 * Gets ads that already received a message from a specific user
 */
export const getAdsContactedByUser = async (
  accountId: string,
  {
    dbClient,
    bypassRLS = false,
  }: {
    dbClient?: TDBClient;
    bypassRLS?: boolean;
  } = {},
): Promise<Pick<TContactedAd, "adId">[]> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.query.contactedAds.findMany({
      where: (table, { eq }) => eq(table.accountId, accountId),
      columns: { adId: true },
    });

  if (bypassRLS) return query(client.admin);
  return client.rls(query);
};
/**
 * Fetches ads matching user's automated robot filters
 */
export const getMatchingAds = async (
  robot: TFiltersWithRelations,
  {
    contactedAdsIds = [],
    excludeContactedAds = true,
    dbClient,
    bypassRLS = false,
  }: {
    contactedAdsIds?: TContactedAd["adId"][];
    excludeContactedAds?: boolean;
    dbClient?: TDBClient;
    bypassRLS?: boolean;
  } = {},
): Promise<TAd[]> => {
  const {
    priceMin,
    priceMax,
    isLowPrice,
    hasBeenReposted,
    hasBeenBoosted,
    isUrgent,
    modelYearMin,
    modelYearMax,
    mileageMin,
    mileageMax,
    priceHasDropped,
    radiusInKm,
    brands,
    adTypeId,
    subTypes,
    location,
  } = robot;

  const client = dbClient || (await createDrizzleSupabaseClient());

  // we get the ids of the locations that are within the radius defined by the user
  const nearbyLocationsIds = await findNearbyLocations({
    dbClient: client,
    location,
    radiusInKm,
  });

  const query = (tx: TDBQuery) =>
    tx.query.ads.findMany({
      where: (table, { eq, and, inArray, notInArray, gte, lte }) =>
        and(
          // Either exclude or take only ads already contacted
          contactedAdsIds.length > 0
            ? excludeContactedAds
              ? notInArray(table.id, contactedAdsIds)
              : inArray(table.id, contactedAdsIds)
            : undefined,

          // ads whose lat/lng are within the radius
          inArray(table.locationId, nearbyLocationsIds),

          eq(table.typeId, adTypeId),

          subTypes.length > 0
            ? inArray(
                table.subtypeId,
                subTypes.map(({ subTypeId }) => subTypeId),
              )
            : undefined,

          gte(table.price, priceMin),
          priceMax != null ? lte(table.price, priceMax) : undefined,

          eq(table.isLowPrice, isLowPrice),
          eq(table.hasBeenReposted, hasBeenReposted),
          eq(table.hasBeenBoosted, hasBeenBoosted),
          eq(table.isUrgent, isUrgent),
          eq(table.priceHasDropped, priceHasDropped),

          gte(table.modelYear, modelYearMin),
          modelYearMax != null ? lte(table.modelYear, modelYearMax) : undefined,

          gte(table.mileage, mileageMin),
          mileageMax != null ? lte(table.mileage, mileageMax) : undefined,

          brands.length > 0
            ? inArray(
                table.brandId,
                brands.map(({ brandId }) => brandId),
              )
            : undefined,
        ),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

  if (bypassRLS) return query(client.admin);
  return client.rls(query);
};

/**
 * Find all locations within a radius of a location
 */
export const findNearbyLocations = async ({
  dbClient,
  locationId,
  location,
  radiusInKm,
}: {
  dbClient: TDBClient;
  locationId?: number;
  location?: TLocation;
  radiusInKm: number;
}): Promise<number[]> => {
  let latCenter: number, lngCenter: number;
  if (location) {
    latCenter = location.lat;
    lngCenter = location.lng;
  } else {
    const fetchedLocationById = await dbClient.admin.query.locations.findFirst({
      where: (table, { eq }) => eq(table.id, locationId!),
      columns: { lat: true, lng: true },
    });
    latCenter = fetchedLocationById!.lat;
    lngCenter = fetchedLocationById!.lng;
  }

  const nearbyLocations = await dbClient.admin.query.locations.findMany({
    where: sql`ST_DWithin(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(${lngCenter}, ${latCenter})::geography,
      ${radiusInKm * 1000}
    )`,
  });

  const locationsIds = nearbyLocations.map(({ id }) => id);

  return locationsIds;
};
