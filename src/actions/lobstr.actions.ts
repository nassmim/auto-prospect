export const collectAdsFromLobstr = async (req: Request, res: Response) => {
  const runId = req.body.id as string;

  const { success, addedAds } = await saveResultsFromRun(runId);
  if (!success) {
    res.status(500).json({
      message: "webhook received but ads not added",
    });
    return;
  }

  // We get the squid as each client has its own squid
  // and we need to get the auto sender preferences for this specific squid
  const squidId = await getSquidFromRun(runId);

  const autoSender: AutoSenderPreferencesTypeWithoutRelations | undefined =
    await db.query.autoSenderPreferences.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.squidId, squidId), eq(table.isActive, true)),
    });
  if (!autoSender) {
    res.status(404).json({
      message: "No auto sender preferences found for this run",
    });
    return;
  }

  const accountId = autoSender.accountId;

  const plan = await getUserPlan(accountId);
  if (!plan) {
    res.status(404).json({
      message: "No active plan found for this user.",
    });
    return;
  }

  let numberOfMessagesSent = 0,
    adsToSendMessageTo: AdDataType[] = [];
  const adsWithPhone = addedAds!.filter((ad) => ad.phoneNumber);

  const matchingAds = getMatchingAds(adsWithPhone, autoSender);

  // We filter the ads to only keeps the ones that have not yet received a message from the user
  if (matchingAds.length)
    adsToSendMessageTo = await getAdsToSendMessageTo(accountId, matchingAds);

  if (
    !adsToSendMessageTo?.length ||
    adsToSendMessageTo.length < plan.maxAutomaticMessages
  ) {
    // This case can happen if the scraper did not get many new ads,
    // in this case, we look at the database to see if some ads were not
    // yet contacted so that we send as many messages as the user's plan allows
    const autoSenderWithAllPreferences =
      (await db.query.autoSenderPreferences.findFirst({
        where: (table, { eq }) => eq(table.id, autoSender.id),
        with: {
          autoSenderPreferencesDepartments: true,
          autoSenderPreferencesBrands: true,
          autoSenderPreferencesDrivingLicences: true,
          autoSenderPreferencesFuels: true,
          autoSenderPreferencesVehicleSubtypes: true,
          autoSenderPreferencesVehicleTypes: true,
          autoSenderPreferencesZipcodes: true,
        },
      })) as AutoSenderPreferencesType;

    const messagedAds = (await getAdsContactedByUser(
      accountId,
    )) as MessagedAdType[];

    /* When getting the ads matching the user criteria, there was an issue due to alias naming 
    So we first get the zipcodes from the departments selected by the user
    */
    const departmentsZipcodes = await getDepartmentsZipcodes(
      autoSenderWithAllPreferences,
    );

    const previousAdsToSendMessageTo = await getMatchingAdsWithAllPreferences({
      autoSender: autoSenderWithAllPreferences,
      departmentsZipcodes,
      messagedAds,
      adsAlreadyMatched: adsToSendMessageTo,
      limit: plan.maxAutomaticMessages - adsToSendMessageTo.length,
    }).catch(() => []);
    adsToSendMessageTo = [...adsToSendMessageTo, ...previousAdsToSendMessageTo];
  }

  if (adsToSendMessageTo.length) {
    const { phoneNumberToDisplay, textVariables } =
      await getSendingMessagesParams(accountId);

    numberOfMessagesSent = await sendMessages(
      autoSender,
      adsToSendMessageTo,
      phoneNumberToDisplay,
      textVariables,
    );
  }

  res.status(200).json({
    message: `webhook received, ${addedAds?.length || 0} ads added and ${numberOfMessagesSent} messages sent`,
  });
};