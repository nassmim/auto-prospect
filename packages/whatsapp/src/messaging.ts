/**
 * WhatsApp Messaging Functions
 * Handles sending messages and checking phone numbers
 */

import { WASocket, WAMessageUpdate } from "@whiskeysockets/baileys";
import { TErrorCode, EWhatsAppErrorCode } from "@auto-prospect/shared";

/**
 * Sends a text message via WhatsApp
 * Uses Baileys functions: onWhatsApp, sendMessage
 */
export const sendWhatsAppMessage = async (
  socket: WASocket,
  phoneNumber: string, // Format: 33612345678 (no +)
  message: string,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  console.log("Sending WhatsApp message");
  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;

    // Check if number exists on WhatsApp
    const results = await socket.onWhatsApp(jid);
    console.log(results);
    if (!results || results.length === 0) {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.RECIPIENT_INVALID,
      };
    }
    const result = results[0];
    if (!result?.exists) {
      return {
        success: false,
        errorCode: EWhatsAppErrorCode.RECIPIENT_INVALID,
      };
    }
    console.log(result);
    console.log(message);

    // Send message and wait for confirmation
    const sentMessage = await socket.sendMessage(result.jid, { text: message });
    console.log("Message sent:", sentMessage);
    console.log("Initial status:", sentMessage?.status);

    // Wait for message acknowledgment from WhatsApp servers
    // Status 1 = PENDING, 2 = SERVER_ACK, 3 = DELIVERY_ACK, 4 = READ
    return new Promise((resolve) => {
      let acknowledged = false;

      // Listen for message status updates
      const messageUpdateListener = (updates: WAMessageUpdate[]) => {
        for (const update of updates) {
          if (update.key?.id === sentMessage?.key?.id) {
            console.log("Message update:", update);
            if (update.update?.status && update.update.status >= 2) {
              // Status >= 2 means server acknowledged (sent to WhatsApp servers)
              acknowledged = true;
              socket.ev.off("messages.update", messageUpdateListener);
              resolve({ success: true });
            }
          }
        }
      };

      socket.ev.on("messages.update", messageUpdateListener);

      // Timeout after 10 seconds - if no acknowledgment, still consider it sent
      // (Baileys may not always emit status updates)
      setTimeout(() => {
        socket.ev.off("messages.update", messageUpdateListener);
        if (!acknowledged) {
          console.log("Timeout waiting for ack - proceeding anyway");
          resolve({ success: true });
        }
      }, 10000);
    });
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.MESSAGE_SEND_FAILED,
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
    const jid = `${phoneNumber}@s.whatsapp.net`;
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
