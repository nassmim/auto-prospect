"use server";

import { createDrizzleSupabaseClient, TDBClient, TDBQuery } from "@/lib/drizzle/dbClient";
import { whatsappSessions } from "@/schema/whatsapp-session.schema";
import { StoredAuthState } from "@/services/whatsapp.service";
import { eq } from "drizzle-orm";

type WhatsAppSessionRow = typeof whatsappSessions.$inferSelect;

/**
 * Retrieves the WhatsApp session for an account
 * Returns null if no session exists
 */
export const getWhatsAppSession = async (
  accountId: string,
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<{ session: WhatsAppSessionRow | null; credentials: StoredAuthState | null }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.query.whatsappSessions.findFirst({
      where: eq(whatsappSessions.accountId, accountId),
    });

  const session = options?.bypassRLS ? await query(client.admin) : await client.rls(query);

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
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<{ success: boolean; error?: string }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const credentialsJson = JSON.stringify(credentials);

  const query = (tx: TDBQuery) =>
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
      });

  try {
    if (options?.bypassRLS) {
      await query(client.admin);
    } else {
      await client.rls(query);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de sauvegarde de la session",
    };
  }
};

/**
 * Updates the connection status of a WhatsApp session
 */
export const updateWhatsAppConnectionStatus = async (
  accountId: string,
  isConnected: boolean,
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<{ success: boolean; error?: string }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx
      .update(whatsappSessions)
      .set({
        isConnected,
        lastConnectedAt: isConnected ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.accountId, accountId));

  try {
    if (options?.bypassRLS) {
      await query(client.admin);
    } else {
      await client.rls(query);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de mise à jour du statut",
    };
  }
};

/**
 * Deletes the WhatsApp session for an account (logout)
 */
export const deleteWhatsAppSession = async (
  accountId: string,
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<{ success: boolean; error?: string }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.delete(whatsappSessions).where(eq(whatsappSessions.accountId, accountId));

  try {
    if (options?.bypassRLS) {
      await query(client.admin);
    } else {
      await client.rls(query);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de suppression de la session",
    };
  }
};

/**
 * Checks if an account has an active WhatsApp connection
 */
export const isWhatsAppConnected = async (
  accountId: string,
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<boolean> => {
  const { session } = await getWhatsAppSession(accountId, options);
  return session?.isConnected ?? false;
};
