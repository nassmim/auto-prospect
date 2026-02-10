/**
 * WhatsApp Connection Management
 * Handles socket creation, lifecycle, and event handling
 */

import makeWASocket, {
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { createDBAuthState } from "./auth";
import {
  StoredAuthState,
  WhatsAppEventHandlers,
  CredentialConnectionResult,
  QRConnectionResult,
} from "./types";

const QR_TIMEOUT_MS = 120000; // 2 minutes

/**
 * Custom logger for Baileys to suppress verbose history notifications
 * These logs flood the console and hide important messages
 */
const createFilteredLogger = () => {
  const noop = () => {};

  return {
    level: "silent",
    fatal: noop,
    error: (msg: unknown) => {
      // Only log actual errors
      if (
        msg instanceof Error ||
        (typeof msg === "string" && msg.toLowerCase().includes("error"))
      ) {
        console.error("[WhatsApp Error]", msg);
      }
    },
    warn: noop,
    info: noop, // Suppress all info logs including history notifications
    debug: noop,
    trace: noop,
    child: () => createFilteredLogger(),
  };
};

/** Converts a QR string (Baileys) to base64 image data URL */
export const generateQRCodeDataURL = async (
  qrString: string,
): Promise<string> => {
  return await QRCode.toDataURL(qrString, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
};

/**
 * Creates a WhatsApp connection with QR code generation
 * Use for initial connection (QR scan)
 */
export const createWhatsAppConnection = async (
  storedState: StoredAuthState | null,
  handlers: WhatsAppEventHandlers,
): Promise<QRConnectionResult> => {
  const { state, saveState } = createDBAuthState(storedState);

  let qrTimeout: NodeJS.Timeout | null = null;
  let isCleanedUp = false;

  // Create connection (Baileys function)
  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Auto-Prospect", "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: createFilteredLogger() as any, // Suppress verbose Baileys logs
  });

  // Clean up connection properly
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      qrTimeout = null;
    }
    socket.end(undefined);
  };

  // Timeout if user doesn't scan in time
  qrTimeout = setTimeout(() => {
    if (!isCleanedUp) {
      handlers.onError("QR code expired. Please try again.");
      cleanup();
    }
  }, QR_TIMEOUT_MS);

  // Listen for connection events (Baileys pattern)
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await generateQRCodeDataURL(qr);
        handlers.onQRCode(qrDataUrl);
      } catch {
        handlers.onError("Failed to generate QR code");
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect =
        statusCode === DisconnectReason.restartRequired || statusCode === 515;

      if (shouldReconnect && !isCleanedUp) {
        // Auto-reconnect after pairing
        console.log("Reconnecting after pairing...");
        setTimeout(async () => {
          try {
            const newSocket = makeWASocket({
              auth: state,
              printQRInTerminal: false,
              browser: ["Auto-Prospect", "Chrome", "1.0.0"],
              syncFullHistory: false,
              markOnlineOnConnect: false,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              logger: createFilteredLogger() as any,
            });

            newSocket.ev.on("connection.update", (newUpdate) => {
              if (newUpdate.connection === "open") {
                if (qrTimeout) {
                  clearTimeout(qrTimeout);
                  qrTimeout = null;
                }
                handlers.onConnected();
              } else if (newUpdate.connection === "close") {
                handlers.onDisconnected("Connection closed after reconnect");
              }
            });
          } catch {
            handlers.onError("Reconnection failed");
          }
        }, 1000);
      } else if (statusCode === DisconnectReason.loggedOut) {
        handlers.onDisconnected("Logged out of WhatsApp");
      } else if (!shouldReconnect) {
        handlers.onDisconnected("Connection closed");
      }
    }

    if (connection === "open") {
      if (qrTimeout) {
        clearTimeout(qrTimeout);
        qrTimeout = null;
      }
      handlers.onConnected();
    }
  });

  // Save credentials on update
  socket.ev.on("creds.update", () => {
    console.log("Credentials updated");
  });

  return { socket, saveState, cleanup };
};

/**
 * Reconnects with existing credentials (no QR code)
 * Use for sending messages
 */
export const connectWithCredentials = async (
  storedState: StoredAuthState,
): Promise<CredentialConnectionResult> => {
  const { state, saveState } = createDBAuthState(storedState);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Auto-Prospect", "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: createFilteredLogger() as any,
  });

  let connectionResolve: ((value: boolean) => void) | null = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    socket.end(undefined);
  };

  // Wait for connection to establish (30s timeout)
  const waitForConnection = (): Promise<boolean> => {
    return new Promise((resolve) => {
      connectionResolve = resolve;
      setTimeout(() => {
        if (connectionResolve) {
          connectionResolve(false);
          connectionResolve = null;
        }
      }, 30000);
    });
  };

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      if (connectionResolve) {
        connectionResolve(true);
        connectionResolve = null;
      }
    } else if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        if (connectionResolve) {
          connectionResolve(false);
          connectionResolve = null;
        }
      }
    }
  });

  return { socket, saveState, waitForConnection, cleanup };
};
