"use server";

import {
  createDrizzleSupabaseClient,
  TDBClient,
  TDBQuery,
} from "@/lib/drizzle/dbClient";
import { accounts } from "@/schema/account.schema";
import { whatsappSessions } from "@/schema/whatsapp-session.schema";
import {
  connectWithCredentials,
  createWhatsAppConnection,
  sendWhatsAppMessage,
  StoredAuthState,
} from "@/services/whatsapp.service";
import { validateWhatsAppNumber } from "@/utils/validation.utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

type WhatsAppSessionRow = typeof whatsappSessions.$inferSelect;

/**
 * Retrieves the WhatsApp session for an account
 * Returns null if no session exists
 */
const getWhatsAppSession = async (
  accountId: string,
  options: { dbClient?: TDBClient; bypassRLS?: boolean } = { bypassRLS: false },
): Promise<{
  session: WhatsAppSessionRow | null;
  credentials: StoredAuthState | null;
}> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) => tx.query.whatsappSessions.findFirst();

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
    if (options?.bypassRLS) await query(client.admin);
    else await client.rls(query);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Échec de sauvegarde de la session",
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
      error:
        error instanceof Error
          ? error.message
          : "Échec de mise à jour du statut",
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
    tx
      .delete(whatsappSessions)
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
      error:
        error instanceof Error
          ? error.message
          : "Échec de suppression de la session",
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

// =============================================================================
// PHONE NUMBER MANAGEMENT
// =============================================================================

/**
 * Updates the WhatsApp phone number for an account
 * Validates and formats the phone number before saving
 * Also deletes any existing WhatsApp session since credentials are tied to the old number
 */
export const updateWhatsAppPhoneNumber = async (
  accountId: string,
  phoneNumber: string,
  options?: { dbClient?: TDBClient },
): Promise<{ success: boolean; formattedNumber?: string; error?: string }> => {
  // Validate and format the phone number
  const validation = validateWhatsAppNumber(phoneNumber);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  try {
    // Check if the number is different from the current one
    const currentAccount = await client.rls((tx) =>
      tx.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
        columns: { whatsappPhoneNumber: true },
      }),
    );

    const numberChanged =
      currentAccount?.whatsappPhoneNumber !== validation.formatted;

    // Update the phone number
    const result = await client.rls((tx) =>
      tx
        .update(accounts)
        .set({ whatsappPhoneNumber: validation.formatted })
        .where(eq(accounts.id, accountId))
        .returning({ id: accounts.id }),
    );

    if (result.length === 0) {
      return { success: false, error: "Compte non trouvé" };
    }

    // If number changed, delete the existing WhatsApp session
    if (numberChanged) {
      await client.admin
        .delete(whatsappSessions)
        .where(eq(whatsappSessions.accountId, accountId));
    }

    return { success: true, formattedNumber: validation.formatted! };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Échec de mise à jour du numéro",
    };
  }
};

/**
 * Gets the WhatsApp phone number for an account
 */
export const getWhatsAppPhoneNumber = async (
  accountId: string,
  options?: { dbClient?: TDBClient; bypassRLS?: boolean },
): Promise<string | null> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      columns: { whatsappPhoneNumber: true },
    });

  const result = options?.bypassRLS
    ? await query(client.admin)
    : await client.rls(query);

  return result?.whatsappPhoneNumber ?? null;
};

// =============================================================================
// WHATSAPP CONNECTION
// =============================================================================

/**
 * Initiates a WhatsApp connection and returns the QR code
 * The connection process is async - this returns the initial QR code
 * The frontend should poll for connection status
 */
export const initiateWhatsAppConnection = async (
  accountId: string,
): Promise<{ success: boolean; qrCode?: string; error?: string }> => {
  try {
    // Get existing session if any
    const { session, credentials: storedCredentials } =
      await getWhatsAppSession(accountId);

    // If session is marked as disconnected, ignore old credentials and start fresh
    const credentialsToUse = session?.isConnected ? storedCredentials : null;

    return new Promise((resolve) => {
      let resolved = false;
      let saveStateFn: (() => StoredAuthState) | null = null;

      createWhatsAppConnection(credentialsToUse, {
        onQRCode: async (qrDataUrl) => {
          if (!resolved) {
            resolved = true;
            resolve({ success: true, qrCode: qrDataUrl });
          }
        },
        onConnected: async () => {
          // Save credentials when connected (including after reconnection)
          if (saveStateFn) {
            try {
              const credentials = saveStateFn();

              await saveWhatsAppSession(accountId, credentials, {
                bypassRLS: true,
              });
              await updateWhatsAppConnectionStatus(accountId, true, {
                bypassRLS: true,
              });
              console.log("WhatsApp connecté et credentials sauvegardés");
            } catch (err) {
              console.error("Erreur sauvegarde credentials:", err);
            }
          }
          if (!resolved) {
            resolved = true;
            resolve({ success: true });
          }
        },
        onDisconnected: (reason) => {
          // Ne pas résoudre avec erreur pour les reconnexions (515)
          console.log("WhatsApp déconnecté:", reason);
        },
        onError: (error) => {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, error });
          }
        },
      }).then(({ saveState }) => {
        saveStateFn = saveState;
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: "Timeout: QR code non généré" });
        }
      }, 120000);
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Échec de connexion WhatsApp",
    };
  }
};

// =============================================================================
// SEND WHATSAPP MESSAGE
// =============================================================================

const sendWhatsAppTextMessageSchema = z.object({
  recipientPhone: z.string().min(1, "Le numéro du destinataire est requis"),
  senderPhone: z.string().min(1, "Le numéro de l'expéditeur est requis"),
  adTitle: z.string().min(1, "Le titre de l'annonce est requis"),
  message: z.string().min(1, "Le message est requis"),
});

export type SendWhatsAppTextMessageInput = z.infer<
  typeof sendWhatsAppTextMessageSchema
>;

export type SendWhatsAppTextMessageResult = {
  success: boolean;
  error?: string;
  needsReconnect?: boolean;
};

/**
 * Sends a WhatsApp text message to a recipient
 * Finds the sender account by phone number, connects with stored credentials, and sends the message
 */
export const sendWhatsAppTextMessage = async (
  input: SendWhatsAppTextMessageInput,
): Promise<SendWhatsAppTextMessageResult> => {
  // Validate input
  const validation = sendWhatsAppTextMessageSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { recipientPhone, senderPhone, message } = validation.data;

  // Validate recipient phone number format
  const recipientValidation = validateWhatsAppNumber(recipientPhone);
  if (!recipientValidation.isValid) {
    return {
      success: false,
      error: `Numéro destinataire invalide: ${recipientValidation.error}`,
    };
  }

  const client = await createDrizzleSupabaseClient();

  try {
    // Find account by sender phone number
    const account = await client.admin.query.accounts.findFirst({
      where: eq(accounts.whatsappPhoneNumber, senderPhone),
    });

    if (!account) {
      return { success: false, error: "Compte expéditeur non trouvé" };
    }

    // Get WhatsApp session credentials
    const { credentials } = await getWhatsAppSession(account.id, {
      bypassRLS: true,
    });

    if (!credentials) {
      return {
        success: false,
        error: "Session WhatsApp non trouvée. Veuillez vous reconnecter.",
      };
    }

    // Connect to WhatsApp with stored credentials
    const { socket, cleanup, waitForConnection } =
      await connectWithCredentials(credentials);

    try {
      // Wait for connection to be established
      const isConnected = await waitForConnection();

      if (!isConnected) {
        cleanup();
        // Session expired or disconnected from phone - update DB status
        await updateWhatsAppConnectionStatus(account.id, false, {
          bypassRLS: true,
        });
        return {
          success: false,
          error: "Session WhatsApp expirée. Veuillez vous reconnecter.",
          needsReconnect: true,
        };
      }

      // Send the message (use validated & formatted recipient number)
      const result = await sendWhatsAppMessage(
        socket,
        recipientValidation.formatted!,
        message,
      );

      // Cleanup connection
      cleanup();

      return result;
    } catch (error) {
      cleanup();
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Échec de l'envoi du message",
    };
  }
};
