import { DB_COLUMS_TO_UPDATE } from "@/constants/ads.constants";
import { EPlatformValue } from "@/constants/enums";
import { createDrizzleSupabaseClient, ModelType } from "@/lib/drizzle/dbClient";
import {
  adSubTypes,
  adTypes,
  brands,
  drivingLicences,
  fuels,
  gearBoxes,
  vehicleSeats,
  vehicleStates,
  zipcodes,
} from "@/schema";
import { TAdReferenceData } from "@/types/ad.types";
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
  modelName: ModelType;
  platformValue: string | undefined | null;
  field: string;
  defaultValue?: number | null;
  dbClient?: Awaited<ReturnType<typeof createDrizzleSupabaseClient>>;
}): Promise<number | null> => {
  if (!platformValue) return defaultValue;

  const client = dbClient || (await createDrizzleSupabaseClient());

  const dataFetched = await client.rls((tx) =>
    // @ts-expect-error - Dynamic model access creates complex union types that TS cannot narrow
    tx.query[modelName].findFirst({
      where: (
        table: { [key: string]: PgColumn },
        { eq }: { eq: BinaryOperator },
      ) => eq(table[field as keyof typeof table], platformValue),
    }),
  );

  // @ts-expect-error - Result type is complex union, but we know it has an id property
  return dataFetched?.id ?? null;
};

/**
 * Gets the right fields depending on the platform from which the ads have been retrieved
 * Enables to then do a lookup and know which value from our db must be associated to the ad
 */
export const fetchAllReferenceData = async (
  dbClient: Awaited<ReturnType<typeof createDrizzleSupabaseClient>>,
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
    dbClient.admin.select().from(zipcodes),
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
