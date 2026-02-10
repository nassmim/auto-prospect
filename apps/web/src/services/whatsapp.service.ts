/**
 * Service WhatsApp - Database integration for Baileys
 *
 * Provides database wrappers for WhatsApp functionality
 * Core Baileys functionality is in @auto-prospect/whatsapp package
 */

import {
  createDrizzleSupabaseClient,
  TDBClient,
  TDBOptions,
  TDBQuery,
  TWhatsappSession,
  whatsappSessions,
} from "@auto-prospect/db";
import {
  EGeneralErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";
import { eq } from "drizzle-orm";

// Import core functions from whatsapp package
import {
  StoredAuthState,
  WhatsAppConnectionResult,
  WhatsAppEventHandlers,
  createDBAuthState,
  createWhatsAppConnection,
  connectWithCredentials,
  sendWhatsAppMessage,
  checkWhatsAppNumber,
} from "@auto-prospect/whatsapp";

// =============================================================================
// RE-EXPORTS for backward compatibility
// =============================================================================

export type { StoredAuthState, WhatsAppConnectionResult, WhatsAppEventHandlers };
export {
  createDBAuthState,
  createWhatsAppConnection,
  connectWithCredentials,
  sendWhatsAppMessage,
  checkWhatsAppNumber,
};

// =============================================================================
// DATABASE FUNCTIONS (web app specific - handle RLS)
// =============================================================================

/**
 * Retrieves the WhatsApp session for an account
 * Returns null if no session exists
 */
export const getWhatsAppSession = async (
  accountId: string,
  options: TDBOptions = { bypassRLS: false },
): Promise<{
  session: TWhatsappSession | null;
  credentials: StoredAuthState | null;
}> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.query.whatsappSessions.findFirst({
      where: (table, { eq }) => eq(table.accountId, accountId),
    });

  const session = options?.bypassRLS
    ? await query(client.admin)
    : await client.rls(query);

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
  dbClient?: TDBClient,
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
export const updateWhatsAppConnectionStatus = async (
  accountId: string,
  isConnected: boolean,
  options?: TDBOptions,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx
      .update(whatsappSessions)
      .set({
        isConnected,
        lastConnectedAt: isConnected
          ? new Date()
          : whatsappSessions.lastConnectedAt,
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.accountId, accountId));

  try {
    if (options?.bypassRLS) await query(client.admin);
    else await client.rls(query);

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EGeneralErrorCode.DATABASE_ERROR,
    };
  }
};

/**
 * Checks if an account has an active WhatsApp connection
 */
export const isWhatsAppConnected = async (
  accountId: string,
  options: TDBOptions = { bypassRLS: false },
): Promise<boolean> => {
  const { session } = await getWhatsAppSession(accountId, options);
  return session?.isConnected ?? false;
};
