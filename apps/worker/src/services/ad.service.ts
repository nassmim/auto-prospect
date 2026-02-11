import {
  adSubTypes,
  adTypes,
  brands,
  drivingLicences,
  fuels,
  gearBoxes,
  locations,
  TAdReferenceData,
  vehicleSeats,
  vehicleStates,
} from "@auto-prospect/db";
import { TDBClient } from "./db.service";

/**
 * Platform field type - which platform-specific value field to use for lookups
 * e.g., "lobstrValue" for Lobstr platform, future platforms can add their own fields
 */
export type TPlatformValue = "lobstrValue";

/**
 * Gets the right fields depending on the platform from which the ads have been retrieved
 * Enables to then do a lookup and know which value from our db must be associated to the ad
 *
 * This is platform-agnostic - works with Lobstr and any future platforms
 * by using the platformField parameter to select the correct lookup field
 */
export const fetchAllReferenceData = async (
  dbClient: TDBClient,
  platformField: TPlatformValue,
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
    dbClient.select().from(adTypes),
    dbClient.select().from(adSubTypes),
    dbClient.select().from(brands),
    dbClient.select().from(locations),
    dbClient.select().from(gearBoxes),
    dbClient.select().from(drivingLicences),
    dbClient.select().from(fuels),
    dbClient.select().from(vehicleSeats),
    dbClient.select().from(vehicleStates),
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
