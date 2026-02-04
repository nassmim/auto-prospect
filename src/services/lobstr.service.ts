import { EPlatformValue } from "@/config/platform.config";
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";
import { ads as adsTable, TAdInsert } from "@/schema";
import {
  fetchAllReferenceData,
  setAdUpdateOnConflict,
} from "@/services/ad.service";
import { sendAlertToAdmin } from "@/services/general.service";
import { TAdFromLobstr, TAdReferenceData } from "@/types/ad.types";
import { customParseInt } from "@/utils/general.utils";
import parsePhoneNumber from "libphonenumber-js";

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
  const dbClient = await createDrizzleSupabaseClient();

  const fetchedResults = await getResultsFromRun(runId);

  const results = await fetchedResults.json();
  const ads: TAdFromLobstr[] = results.data;

  // Fetch all reference data so that we know which fields to use given
  // that the ads are coming from Lobstr
  const referenceData = await fetchAllReferenceData(
    dbClient,
    EPlatformValue.LOBSTR,
  );

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
  await dbClient.admin
    .insert(adsTable)
    .values(adsToPersist)
    .onConflictDoUpdate({
      target: [adsTable.originalAdId, adsTable.url],
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
    phoneNumber: parsePhoneNumber(ad.phone || "", "FR")?.number || null,
    picture: ad.picture,
    initialPublicationDate: new Date(ad.first_publication_date).toDateString(),
    lastPublicationDate: new Date(ad.last_publication_date).toDateString(),
    ownerName: ad.owner_name,
    hasBeenBoosted: ad.is_boosted,
    isUrgent: ad.urgent,
    modelYear: customParseInt(adDetails["Année modèle"]),
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
  adData.drivingLicenceId = adDetails["Permis"]
    ? referenceData.drivingLicences.get(adDetails["Permis"]) || 1
    : 1;
  adData.fuelId = adDetails["Carburant"]
    ? referenceData.fuels.get(adDetails["Carburant"]) || null
    : null;
  adData.vehicleSeatsId = adDetails["Nombre de place(s)"]
    ? referenceData.vehicleSeats.get(adDetails["Nombre de place(s)"]) || null
    : null;
  adData.vehicleStateId = adDetails["État du véhicule"]
    ? referenceData.vehicleStates.get(adDetails["État du véhicule"]) || 2
    : 2;
  adData.subtypeId = adDetails["Type de véhicule"]
    ? referenceData.adSubTypes.get(adDetails["Type de véhicule"]) || null
    : null;

  return adData as TAdInsert;
};
