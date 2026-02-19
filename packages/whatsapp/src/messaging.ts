/**
 * WhatsApp Messaging Functions
 * Handles sending messages and checking phone numbers
 */

import {
  ELeadErrorCode,
  EMessageErrorCode,
  TErrorCode,
} from "@auto-prospect/shared";
import { WASocket } from "@whiskeysockets/baileys";

/**
 * Sends a text message via WhatsApp
 * Uses Baileys functions: onWhatsApp, sendMessage
 *
 * Dedicated server: No need to wait for status acknowledgment.
 * Socket remains open and WhatsApp servers have time to receive the message.
 */
export const sendWhatsAppMessage = async (
  socket: WASocket,
  jid: string,
  message: string,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  try {
    // Check if number exists on WhatsApp
    const results = await socket.onWhatsApp(jid);

    if (!results || results.length === 0) {
      return {
        success: false,
        errorCode: ELeadErrorCode.RECIPIENT_PHONE_INVALID,
      };
    }
    const result = results[0];
    if (!result?.exists) {
      return {
        success: false,
        errorCode: ELeadErrorCode.RECIPIENT_PHONE_INVALID,
      };
    }

    // Send message - no need to wait for acknowledgment on dedicated server
    await socket.sendMessage(result.jid, { text: message });

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EMessageErrorCode.MESSAGE_SEND_FAILED,
    };
  }
};

/**
 * Checks if a phone number exists on WhatsApp
 * Uses Baileys function: onWhatsApp
 */
export const checkWhatsAppNumber = async (
  socket: WASocket,
  phoneNumber: string,
): Promise<{ exists: boolean; jid?: string }> => {
  try {
    const jid = getWhatsAppJID(phoneNumber);
    const results = await socket.onWhatsApp(jid);
    if (!results || results.length === 0) {
      return { exists: false };
    }
    const result = results[0];
    return { exists: Boolean(result.exists), jid: result.jid };
  } catch {
    return { exists: false };
  }
};

/**
 * Extracts WhatsApp JID from phone number
 * Converts "+33612345678" to "33612345678@s.whatsapp.net"
 */
export function getWhatsAppJID(phone: string): string {
  const cleaned = phone.replace(/^\+/, "");
  return `${cleaned}@s.whatsapp.net`;
}
