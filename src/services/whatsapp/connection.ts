import makeWASocket, {
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { getAuthState } from "./auth-state";
import type { ConnectionUpdateCallback, WhatsappConnectionStatus } from "./types";

// Store active connections in memory (keyed by accountId)
const activeConnections = new Map<string, WASocket>();

const logger = pino({ level: "silent" });

export async function createWhatsappConnection(
  accountId: string,
  onUpdate: ConnectionUpdateCallback
): Promise<WASocket> {
  // Close existing connection if any
  await closeWhatsappConnection(accountId);

  const { state, saveCreds } = await getAuthState(accountId);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ["Auto-Prospect", "Chrome", "1.0.0"],
  });

  activeConnections.set(accountId, socket);

  // Handle credentials update
  socket.ev.on("creds.update", saveCreds);

  // Handle connection updates
  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      onUpdate({
        qrCode: qr,
        status: "connecting",
      });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        onUpdate({ status: "disconnected" });
        // Attempt to reconnect
        createWhatsappConnection(accountId, onUpdate);
      } else {
        onUpdate({ status: "disconnected" });
        activeConnections.delete(accountId);
      }
    } else if (connection === "open") {
      onUpdate({
        status: "connected",
        connection: "open",
      });
    }
  });

  return socket;
}

export async function closeWhatsappConnection(accountId: string): Promise<void> {
  const socket = activeConnections.get(accountId);
  if (socket) {
    socket.end(undefined);
    activeConnections.delete(accountId);
  }
}

export function getWhatsappConnection(accountId: string): WASocket | undefined {
  return activeConnections.get(accountId);
}

export function isConnected(accountId: string): boolean {
  const socket = activeConnections.get(accountId);
  return socket?.user !== undefined;
}

export function getConnectionStatus(accountId: string): WhatsappConnectionStatus {
  const socket = activeConnections.get(accountId);
  if (!socket) return "disconnected";
  if (socket.user) return "connected";
  return "connecting";
}
