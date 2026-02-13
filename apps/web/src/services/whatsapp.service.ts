/**
 * Service WhatsApp - Database integration for Baileys
 *
 * Provides database wrappers for WhatsApp functionality
 * Core Baileys functionality is in @auto-prospect/whatsapp package
 */

import {
  eq,
  TDBWithTokenClient,
  TWhatsappSession,
  whatsappSessions,
} from "@auto-prospect/db";
import {
  EGeneralErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";

// Import core functions from whatsapp package
import { createDrizzleSupabaseClient } from "@/lib/db";
import { StoredAuthState } from "@auto-prospect/whatsapp";

// =============================================================================
// DATABASE FUNCTIONS (web app specific - handle RLS)
// =============================================================================

/**
 * Retrieves the WhatsApp session for an account
 * Returns null if no session exists
 */
export const getWhatsAppSession = async (
  accountId: string,
  dbClient?: TDBWithTokenClient,
): Promise<{
  session: TWhatsappSession | null;
  credentials: StoredAuthState | null;
}> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const session = await client.rls((tx) =>
    tx.query.whatsappSessions.findFirst({
      where: (table, { eq }) => eq(table.accountId, accountId),
    }),
  );

  if (!session || !session.credentials) {
    return { session: session || null, credentials: null };
  }

  // Parse credentials JSON (contains { creds, keys })
  try {
    const credentials = JSON.parse(session.credentials) as StoredAuthState;
    return { session, credentials };
  } catch {
    return { session, credentials: null };
  }
};

/**
 * Creates or updates the WhatsApp session for an account
 * Stores encrypted credentials as JSON
 */
export const saveWhatsAppSession = async (
  accountId: string,
  credentials: StoredAuthState,
  dbClient?: TDBWithTokenClient,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const credentialsJson = JSON.stringify(credentials);

  try {
    await client.rls((tx) =>
      tx
        .insert(whatsappSessions)
        .values({
          accountId,
          credentials: credentialsJson,
          isConnected: true,
          lastConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: whatsappSessions.accountId,
          set: {
            credentials: credentialsJson,
            isConnected: true,
            lastConnectedAt: new Date(),
            updatedAt: new Date(),
          },
        }),
    );
    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.SESSION_SAVE_FAILED,
    };
  }
};

/**
 * Updates the connection status of a WhatsApp session
 */
export const updateWhatsAppConnectionStatus = async ({
  accountId,
  isConnected,
  dbClient,
}: {
  accountId: string;
  isConnected: boolean;
  dbClient?: TDBWithTokenClient;
}): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  try {
    await client.rls((tx) =>
      tx
        .update(whatsappSessions)
        .set({
          isConnected,
          lastConnectedAt: isConnected
            ? new Date()
            : whatsappSessions.lastConnectedAt,
          updatedAt: new Date(),
        })
        .where(eq(whatsappSessions.accountId, accountId)),
    );

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EGeneralErrorCode.DATABASE_ERROR,
    };
  }
};
