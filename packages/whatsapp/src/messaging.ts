/**
 * WhatsApp Messaging Functions
 * Handles sending messages and checking phone numbers
 */
import { EWhatsAppErrorCode, TErrorCode } from "@auto-prospect/shared";
import { Boom } from "@hapi/boom";
import { DisconnectReason, WASocket } from "@whiskeysockets/baileys";

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

    // Send message - no need to wait for acknowledgment on dedicated server
    await socket.sendMessage(result.jid, { text: message });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorCode: classifyBaileysError(error),
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

/**
 * Classifies a Baileys error into an app error code
 *
 * Baileys wraps errors as Boom objects with statusCode matching DisconnectReason.
 * Network errors (ECONNRESET, ETIMEDOUT, etc.) are plain Error objects.
 */
function classifyBaileysError(error: unknown): EWhatsAppErrorCode {
  // Boom errors from Baileys (DisconnectReason mapped to statusCode)
  const boomError = error instanceof Boom ? error : (error as { output?: Boom["output"] });
  const statusCode = boomError?.output?.statusCode;

  if (statusCode) {
    switch (statusCode) {
      // Permanent — session is dead
      case DisconnectReason.loggedOut: // 401
      case DisconnectReason.forbidden: // 403
        return EWhatsAppErrorCode.LOGGED_OUT;
      case DisconnectReason.badSession: // 500
        return EWhatsAppErrorCode.BAD_SESSION;
      case DisconnectReason.multideviceMismatch: // 411
        return EWhatsAppErrorCode.MULTIDEVICE_MISMATCH;
      case DisconnectReason.connectionReplaced: // 440
        return EWhatsAppErrorCode.CONNECTION_REPLACED;

      // Temporary — worth retrying
      case DisconnectReason.connectionLost: // 408 (same as timedOut)
        return EWhatsAppErrorCode.CONNECTION_TIMEOUT;
      case DisconnectReason.connectionClosed: // 428
      case DisconnectReason.unavailableService: // 503
      case DisconnectReason.restartRequired: // 515
        return EWhatsAppErrorCode.CONNECTION_FAILED;
      case 429:
        return EWhatsAppErrorCode.RATE_LIMITED;
    }
  }

  // Network errors (plain Error objects from Node.js)
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("epipe")
    ) {
      return EWhatsAppErrorCode.CONNECTION_TIMEOUT;
    }
    if (msg.includes("not authenticated") || msg.includes("logged out")) {
      return EWhatsAppErrorCode.LOGGED_OUT;
    }
  }

  return EWhatsAppErrorCode.MESSAGE_SEND_FAILED;
}
