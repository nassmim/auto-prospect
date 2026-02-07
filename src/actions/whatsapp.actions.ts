"use server";

import {
  EGeneralErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@/config/error-codes";
import { createDrizzleSupabaseClient, TDBClient } from "@/lib/drizzle/dbClient";
import { accounts } from "@/schema/account.schema";
import { whatsappSessions } from "@/schema/whatsapp-session.schema";
import {
  connectWithCredentials,
  createWhatsAppConnection,
  getWhatsAppSession,
  saveWhatsAppSession,
  sendWhatsAppMessage,
  StoredAuthState,
  updateWhatsAppConnectionStatus,
} from "@/services/whatsapp.service";
import { validateWhatsAppNumber } from "@/utils/validation.utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Deletes the WhatsApp session for an account (logout)
 */
export const deleteWhatsAppSession = async (
  accountId: string,
  dbClient?: TDBClient,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  try {
    await client.rls((tx) =>
      tx
        .delete(whatsappSessions)
        .where(eq(whatsappSessions.accountId, accountId)),
    );
    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.SESSION_DELETE_FAILED,
    };
  }
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
): Promise<{
  success: boolean;
  formattedNumber?: string;
  errorCode?: TErrorCode;
}> => {
  // Validate and format the phone number
  const validation = validateWhatsAppNumber(phoneNumber);
  if (!validation.isValid) {
    return { success: false, errorCode: validation.errorCode };
  }

  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  try {
    // Check if the number is different from the current one
    const currentAccount = await client.rls((tx) =>
      tx.query.accounts.findFirst({
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
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
      };
    }

    // If number changed, delete the existing WhatsApp session
    if (numberChanged) {
      await client.rls((tx) =>
        tx
          .delete(whatsappSessions)
          .where(eq(whatsappSessions.accountId, accountId)),
      );
    }

    return { success: true, formattedNumber: validation.formatted! };
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.PHONE_UPDATE_FAILED,
    };
  }
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
): Promise<{ success: boolean; qrCode?: string; errorCode?: TErrorCode }> => {
  try {
    const dbClient = await createDrizzleSupabaseClient();

    // Get existing session if any
    const { session, credentials: storedCredentials } =
      await getWhatsAppSession(accountId, { dbClient });

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

              await saveWhatsAppSession(accountId, credentials);
              await updateWhatsAppConnectionStatus(accountId, true, {
                dbClient,
              });
            } catch {
              resolve({
                success: false,
                errorCode: EWhatsAppErrorCode.CONNECTION_FAILED,
              });
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
        onError: () => {
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              errorCode: EWhatsAppErrorCode.QR_GENERATION_FAILED,
            });
          }
        },
      }).then(({ saveState }) => {
        saveStateFn = saveState;
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            errorCode: EWhatsAppErrorCode.CONNECTION_TIMEOUT,
          });
        }
      }, 120000);
    });
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.CONNECTION_FAILED,
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
  errorCode?: TErrorCode;
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
    return { success: false, errorCode: EGeneralErrorCode.VALIDATION_FAILED };
  }

  const { recipientPhone, senderPhone, message } = validation.data;

  // Validate recipient phone number format
  const recipientValidation = validateWhatsAppNumber(recipientPhone);
  if (!recipientValidation.isValid) {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.RECIPIENT_INVALID,
    };
  }

  const dbClient = await createDrizzleSupabaseClient();

  try {
    // Find account by sender phone number
    const account = await dbClient.admin.query.accounts.findFirst({
      where: eq(accounts.whatsappPhoneNumber, senderPhone),
    });

    if (!account) {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.ACCOUNT_NOT_FOUND,
      };
    }

    // Get WhatsApp session credentials
    const { credentials } = await getWhatsAppSession(account.id, {
      dbClient,
      bypassRLS: true,
    });

    if (!credentials) {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.SESSION_NOT_FOUND,
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
          dbClient,
        });
        return {
          success: false,
          errorCode: EWhatsAppErrorCode.SESSION_EXPIRED,
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
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
    };
  }
};
