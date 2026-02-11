import { CACHE_TAGS } from "@/lib/cache.config";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { getUserAccount } from "@/services/account.service";
import { getContactedLeads, getTotalLeads } from "@/services/lead.service";
import { TDBWithTokenClient } from "@auto-prospect/db";
import { HUNT_WITH_RELATIONS, THuntSummary } from "@auto-prospect/shared";
import { EHuntStatus } from "@auto-prospect/shared/src/config/hunt.config";
import { cacheTag, updateTag } from "next/cache";

/**
 * Fetches hunt configurations (without credits) - CACHED
 * This is the cached version that only returns hunt config
 */
export async function getAccountHuntsConfig() {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedAccountHuntsConfig(account.id, dbClient);
}

/**
 * Internal cached function for hunt configurations
 */
async function getCachedAccountHuntsConfig(
  accountId: string,
  dbClient?: TDBWithTokenClient,
) {
  "use cache";

  cacheTag(CACHE_TAGS.huntsByAccount(accountId));

  const client = dbClient || (await createDrizzleSupabaseClient());

  // Use RLS wrapper to ensure user can only see their account's hunts
  const huntsData = await client.rls(async (tx) => {
    return tx.query.hunts.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: HUNT_WITH_RELATIONS,
    });
  });

  return huntsData;
}

/**
 * Fetches channel credits for multiple hunts - NOT CACHED
 * Called separately when credit display is needed
 */
export async function getHuntsChannelCredits(huntIds: string[]) {
  const dbClient = await createDrizzleSupabaseClient();

  const allChannelCredits = await dbClient.rls(async (tx) => {
    return tx.query.huntChannelCredits.findMany({
      where: (table, { inArray }) => inArray(table.huntId, huntIds),
    });
  });

  // Group credits by hunt ID
  const creditsByHuntId = new Map<string, typeof allChannelCredits>();
  for (const credit of allChannelCredits) {
    if (!creditsByHuntId.has(credit.huntId)) {
      creditsByHuntId.set(credit.huntId, []);
    }
    creditsByHuntId.get(credit.huntId)!.push(credit);
  }

  return creditsByHuntId;
}

/**
 * Fetches all hunts for the current user's account with channel credits
 * Combines cached config with fresh credits
 */
export async function getAccountHunts() {
  // Get cached hunt configs
  const huntsData = await getAccountHuntsConfig();

  if (huntsData.length === 0) {
    return [];
  }

  // Fetch fresh channel credits
  const huntIds = huntsData.map(({ id }) => id);
  const creditsByHuntId = await getHuntsChannelCredits(huntIds);

  // Attach credits to each hunt
  return huntsData.map((hunt) => ({
    ...hunt,
    channelCredits: creditsByHuntId.get(hunt.id) || [],
  }));
}

/**
 * Fetches hunt config by ID (without credits) - CACHED
 */
export async function getHuntConfigById(huntId: string) {
  const dbClient = await createDrizzleSupabaseClient();
  const account = await getUserAccount(dbClient, {
    columnsToKeep: { id: true },
  });
  return getCachedHuntConfigById(huntId, account.id, dbClient);
}

/**
 * Internal cached function for single hunt config
 */
async function getCachedHuntConfigById(
  huntId: string,
  accountId: string,
  dbClient?: TDBWithTokenClient,
) {
  "use cache";

  cacheTag(CACHE_TAGS.hunt(huntId), CACHE_TAGS.huntsByAccount(accountId));

  const client = dbClient || (await createDrizzleSupabaseClient());

  const hunt = await client.rls(async (tx) => {
    return tx.query.hunts.findFirst({
      where: (table, { eq }) => eq(table.id, huntId),
      with: HUNT_WITH_RELATIONS,
    });
  });

  if (!hunt) {
    throw new Error("hunt not found");
  }

  return hunt;
}

/**
 * Fetches a single hunt by ID with channel credits
 * Combines cached config with fresh credits
 */
export async function getHuntById(huntId: string) {
  // Get cached hunt config
  const hunt = await getHuntConfigById(huntId);

  // Fetch fresh channel credits
  const dbClient = await createDrizzleSupabaseClient();
  const channelCreditsData = await dbClient.rls(async (tx) => {
    return tx.query.huntChannelCredits.findMany({
      where: (table, { eq }) => eq(table.huntId, huntId),
    });
  });

  return {
    ...hunt,
    channelCredits: channelCreditsData,
  };
}

/**
 * Fetches active hunts with summary data for dashboard
 */
export async function getActiveHunts(): Promise<THuntSummary[]> {
  const dbClient = await createDrizzleSupabaseClient();

  const hunts = await dbClient.rls(async (tx) => {
    // Fetch hunts with lead counts
    const huntsData = await tx.query.hunts.findMany({
      where: (table, { eq }) => eq(table.status, EHuntStatus.ACTIVE),
      orderBy: (table, { desc }) => [
        desc(table.lastScanAt),
        desc(table.createdAt),
      ],
      limit: 10, // Show top 10 active hunts
    });

    // Get lead counts for each hunt - pass transaction to avoid nested RLS calls
    const huntSummaries: THuntSummary[] = await Promise.all(
      huntsData.map(async (hunt) => {
        const [{ totalLeads }, { contactedLeadsCount }] = await Promise.all([
          getTotalLeads({ huntId: hunt.id, tx }),
          getContactedLeads({ huntId: hunt.id, tx }),
        ]);

        return {
          id: hunt.id,
          name: hunt.name,
          status: hunt.status,
          leadCount: totalLeads,
          contactedCount: contactedLeadsCount,
          lastScanAt: hunt.lastScanAt,
          createdAt: hunt.createdAt,
        };
      }),
    );

    return huntSummaries;
  });

  return hunts;
}

export const updateAccountHuntsCache = async (
  dbClient: TDBWithTokenClient,
  huntId?: string,
  accountId?: string,
) => {
  let accountIdToUse = accountId;
  if (!accountIdToUse) {
    const account = await getUserAccount(dbClient, {
      columnsToKeep: { id: true },
    });
    accountIdToUse = account.id;
  }

  updateTag(CACHE_TAGS.huntsByAccount(accountIdToUse));
  if (huntId) updateTag(CACHE_TAGS.hunt(huntId));
};
