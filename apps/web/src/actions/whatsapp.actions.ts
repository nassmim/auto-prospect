"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { updateLeadMessagesCache } from "@/services/lead.service";
import {
  getWhatsAppSession,
  saveWhatsAppSession,
  updateWhatsAppConnectionStatus,
} from "@/services/whatsapp.service";
import { extractLeadVariables } from "@/utils/lead.utils";
import { renderMessageTemplate } from "@/utils/message.utils";
import { validateWhatsAppNumber } from "@/utils/validation.utils";
import {
  accounts,
  eq,
  leadNotes,
  messages,
  TDBWithTokenClient,
  whatsappSessions,
} from "@auto-prospect/db";
import {
  EAccountErrorCode,
  EContactChannel,
  EGeneralErrorCode,
  ELeadErrorCode,
  EMessageErrorCode,
  EMessageStatus,
  EWhatsAppErrorCode,
  TErrorCode,
  WORKER_ROUTES,
} from "@auto-prospect/shared";
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
        errorCode: EAccountErrorCode.ACCOUNT_NOT_FOUND,
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
      errorCode: EGeneralErrorCode.SERVER_ERROR,
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
};

/**
 * Sends a WhatsApp text message to a lead
 * Main entry point for sending WhatsApp messages from the client
 * Handles: template fetching, message rendering, API call, and logging
 */
export const sendWhatsAppTextMessage = async (
  leadId: string,
): Promise<SendWhatsAppTextMessageResult> => {
  try {
    const dbClient = await createDrizzleSupabaseClient();

    // Get lead data with necessary relations
    const lead = await dbClient.rls((tx) =>
      tx.query.leads.findFirst({
        where: (table, { eq }) => eq(table.id, leadId),
        columns: {
          id: true,
          huntId: true,
          assignedToId: true,
          accountId: true,
        },
        with: {
          ad: {
            columns: {
              phoneNumber: true,
              title: true,
              price: true,
              model: true,
              modelYear: true,
              ownerName: true,
            },
            with: {
              brand: {
                columns: { name: true },
              },
              location: {
                columns: { name: true },
              },
            },
          },
          account: {
            columns: { id: true, whatsappPhoneNumber: true },
            with: {
              whatsappSession: {
                columns: { credentials: true },
              },
            },
          },
        },
      }),
    );

    if (!lead) {
      return {
        success: false,
        errorCode: ELeadErrorCode.LEAD_NOT_FOUND,
      };
    }

    // Validate lead has phone number
    if (!lead.ad.phoneNumber) {
      return {
        success: false,
        errorCode: ELeadErrorCode.RECIPIENT_PHONE_INVALID,
      };
    }

    // Validate account WhatsApp phone number is configured
    if (!lead.account.whatsappPhoneNumber) {
      return {
        success: false,
        errorCode: EAccountErrorCode.PHONE_INVALID,
      };
    }

    // Validate recipient phone number format
    const recipientValidation = validateWhatsAppNumber(lead.ad.phoneNumber);
    if (!recipientValidation.isValid) {
      return {
        success: false,
        errorCode: ELeadErrorCode.RECIPIENT_PHONE_INVALID,
      };
    }

    // Verify WhatsApp session exists
    const session = lead.account.whatsappSession;
    if (!session || !session.credentials) {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.SESSION_NOT_FOUND,
      };
    }

    // Parse and validate session credentials
    let credentials;
    try {
      credentials = JSON.parse(session.credentials);
    } catch {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.SESSION_EXPIRED,
      };
    }

    // Fetch default WhatsApp template for this account
    const template = await dbClient.rls((tx) =>
      tx.query.messageTemplates.findFirst({
        where: (table, { eq, and }) =>
          and(
            eq(table.accountId, lead.accountId),
            eq(table.channel, EContactChannel.WHATSAPP_TEXT),
            eq(table.isDefault, true),
          ),
      }),
    );

    // Render message with template variables
    const variables = extractLeadVariables(lead);
    const defaultMessage = `Bonjour, je suis intéressé par votre annonce "${lead.ad.title}".`;
    const renderedMessage = template
      ? renderMessageTemplate(template.content || defaultMessage, variables)
      : defaultMessage;

    // ===== EXECUTION PHASE =====
    // Send WhatsApp message via worker API
    const response = await fetch(
      `${process.env.WORKER_API_URL}${WORKER_ROUTES.WHATSAPP_TEXT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_API_SECRET}`,
        },
        body: JSON.stringify({
          recipientPhone: recipientValidation.formatted!,
          message: renderedMessage,
          accountId: lead.account.id,
          credentials,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        errorCode: result.error || EMessageErrorCode.MESSAGE_SEND_FAILED,
      };
    }

    // ===== LOGGING PHASE =====
    // Message sent successfully - log it to database
    await dbClient.rls(async (tx) => {
      // Log message in messages table
      await tx.insert(messages).values({
        leadId,
        templateId: template?.id || null,
        channel: EContactChannel.WHATSAPP_TEXT,
        content: renderedMessage,
        status: EMessageStatus.SENT,
        sentAt: new Date(),
        sentById: lead.assignedToId || lead.accountId,
      });

      // Log activity note
      await tx.insert(leadNotes).values({
        leadId,
        content: `Message WhatsApp envoyé`,
      });
    });

    // Update cache
    await updateLeadMessagesCache(leadId);

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EMessageErrorCode.MESSAGE_SEND_FAILED,
    };
  }
};
