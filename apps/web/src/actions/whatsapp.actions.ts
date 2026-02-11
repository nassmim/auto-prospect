"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import {
  getWhatsAppSession,
  saveWhatsAppSession,
  updateWhatsAppConnectionStatus,
} from "@/services/whatsapp.service";
import { validateWhatsAppNumber } from "@/utils/validation.utils";
import {
  sendWhatsAppTextMessageSchema,
  TSendWhatsAppTextMessageSchema,
} from "@/validation-schemas/whatsapp.validation";
import {
  accounts,
  eq,
  TDBWithTokenClient,
  whatsappSessions,
} from "@auto-prospect/db";
import {
  EGeneralErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";
import {
  createWhatsAppConnection,
  StoredAuthState,
} from "@auto-prospect/whatsapp";

/**
 * Deletes the WhatsApp session for an account (logout)
 */
export const deleteWhatsAppSession = async (
  accountId: string,
  dbClient?: TDBWithTokenClient,
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
  options?: { dbClient?: TDBWithTokenClient },
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
      await getWhatsAppSession(accountId, dbClient);

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

              await saveWhatsAppSession(accountId, credentials, dbClient);
              await updateWhatsAppConnectionStatus({
                accountId,
                isConnected: true,
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
  data: TSendWhatsAppTextMessageSchema,
): Promise<SendWhatsAppTextMessageResult> => {
  // Validate data
  const validation = sendWhatsAppTextMessageSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, errorCode: EGeneralErrorCode.VALIDATION_FAILED };
  }

  const { recipientPhone, message } = validation.data;

  // Validate recipient phone number format
  const recipientValidation = validateWhatsAppNumber(recipientPhone);
  if (!recipientValidation.isValid) {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.RECIPIENT_INVALID,
    };
  }

  try {
    // Call endpoint
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
    };
  }
};
