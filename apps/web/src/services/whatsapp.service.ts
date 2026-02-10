/**
 * Service WhatsApp - Intégration Baileys
 *
 * Baileys = librairie pour se connecter à WhatsApp Web sans navigateur
 * Doc: https://github.com/WhiskeySockets/Baileys
 */

import {
  createDrizzleSupabaseClient,
  TDBClient,
  TDBOptions,
  TDBQuery,
  TWhatsappSession,
  whatsappSessions,
} from "@auto-prospect/db";
import { decryptCredentials, encryptCredentials } from "@auto-prospect/shared";
import {
  EGeneralErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";
import { Boom } from "@hapi/boom";
import makeWASocket, {
  AuthenticationState,
  BufferJSON,
  DisconnectReason,
  initAuthCreds,
  SignalDataTypeMap,
  WAMessageUpdate,
  WASocket,
} from "@whiskeysockets/baileys";
import { eq } from "drizzle-orm";
import * as QRCode from "qrcode";

// =============================================================================
// TYPES
// =============================================================================

/** Credentials stockés en DB (chiffrés) */
export type StoredAuthState = {
  creds: string;
  keys: string;
};

/** Résultat d'une connexion WhatsApp */
export type WhatsAppConnectionResult = {
  success: boolean;
  error?: string;
  qrCode?: string;
  isConnected?: boolean;
};

/** Callbacks pour gérer les événements de connexion */
export type WhatsAppEventHandlers = {
  onQRCode: (qrDataUrl: string) => void;
  onConnected: () => void;
  onDisconnected: (reason: string) => void;
  onError: (error: string) => void;
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY!;
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

/**
 * Retrieves the WhatsApp session for an account
 * Returns null if no session exists
 */
export const getWhatsAppSession = async (
  accountId: string,
  options: TDBOptions = { bypassRLS: false },
): Promise<{
  session: TWhatsappSession | null;
  credentials: StoredAuthState | null;
}> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx.query.whatsappSessions.findFirst({
      where: (table, { eq }) => eq(table.accountId, accountId),
    });

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

// =============================================================================
// FONCTIONS
// =============================================================================

/** Convertit un QR string (Baileys) en image base64 affichable */
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
 * Crée un auth state compatible Baileys mais stocké en DB (au lieu de fichiers)
 * - Charge et déchiffre les credentials existants
 * - Retourne saveState() pour sauvegarder après connexion
 */
export const createDBAuthState = (
  storedState: StoredAuthState | null,
): {
  state: AuthenticationState;
  saveState: () => StoredAuthState;
} => {
  let creds = initAuthCreds();
  let keys: Record<string, Record<string, unknown>> = {};

  // Charger les credentials existants si disponibles
  if (storedState) {
    try {
      const decryptedCreds = decryptCredentials(
        storedState.creds,
        ENCRYPTION_KEY,
      );
      creds = JSON.parse(decryptedCreds, BufferJSON.reviver);

      const decryptedKeys = decryptCredentials(
        storedState.keys,
        ENCRYPTION_KEY,
      );
      keys = JSON.parse(decryptedKeys, BufferJSON.reviver);
    } catch (error) {
      console.error("Échec du déchiffrement des credentials:", error);
      creds = initAuthCreds();
      keys = {};
    }
  }

  // Format attendu par Baileys
  const state: AuthenticationState = {
    creds,
    keys: {
      get: (type, ids) => {
        const data: Record<string, SignalDataTypeMap[typeof type]> = {};
        for (const id of ids) {
          const value = keys[type]?.[id];
          if (value) {
            data[id] = value as SignalDataTypeMap[typeof type];
          }
        }
        return data;
      },
      set: (data) => {
        for (const category in data) {
          const categoryData = data[category as keyof SignalDataTypeMap];
          if (!categoryData) continue;
          if (!keys[category]) keys[category] = {};
          for (const id in categoryData) {
            const value = categoryData[id];
            if (value) {
              keys[category][id] = value;
            } else {
              delete keys[category][id];
            }
          }
        }
      },
    },
  };

  // Retourne les credentials chiffrés pour stockage en DB
  const saveState = (): StoredAuthState => {
    const credsJson = JSON.stringify(creds, BufferJSON.replacer);
    const keysJson = JSON.stringify(keys, BufferJSON.replacer);
    return {
      creds: encryptCredentials(credsJson, ENCRYPTION_KEY),
      keys: encryptCredentials(keysJson, ENCRYPTION_KEY),
    };
  };

  return { state, saveState };
};

/**
 * Crée une connexion WhatsApp avec génération de QR code
 * Utiliser pour la première connexion (scan QR)
 */
export const createWhatsAppConnection = async (
  storedState: StoredAuthState | null,
  handlers: WhatsAppEventHandlers,
): Promise<{
  socket: WASocket;
  saveState: () => StoredAuthState;
  cleanup: () => void;
}> => {
  const { state, saveState } = createDBAuthState(storedState);

  let qrTimeout: NodeJS.Timeout | null = null;
  let isCleanedUp = false;

  // Créer la connexion (fonction Baileys)
  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Auto-Prospect", "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: createFilteredLogger() as any, // Suppress verbose Baileys logs
  });

  // Ferme proprement la connexion
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      qrTimeout = null;
    }
    socket.end(undefined);
  };

  // Timeout si l'utilisateur ne scanne pas à temps
  qrTimeout = setTimeout(() => {
    if (!isCleanedUp) {
      handlers.onError("QR code expiré. Veuillez réessayer.");
      cleanup();
    }
  }, QR_TIMEOUT_MS);

  // Écouter les événements de connexion (pattern Baileys)
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await generateQRCodeDataURL(qr);
        handlers.onQRCode(qrDataUrl);
      } catch {
        handlers.onError("Échec de génération du QR code");
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect =
        statusCode === DisconnectReason.restartRequired || statusCode === 515;

      if (shouldReconnect && !isCleanedUp) {
        // Reconnexion automatique après pairing
        console.log("Reconnexion après pairing...");
        setTimeout(async () => {
          try {
            const newSocket = makeWASocket({
              auth: state,
              printQRInTerminal: false,
              browser: ["Auto-Prospect", "Chrome", "1.0.0"],
              syncFullHistory: false,
              markOnlineOnConnect: false,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              logger: createFilteredLogger() as any, // Suppress verbose Baileys logs
            });

            newSocket.ev.on("connection.update", (newUpdate) => {
              if (newUpdate.connection === "open") {
                if (qrTimeout) {
                  clearTimeout(qrTimeout);
                  qrTimeout = null;
                }
                handlers.onConnected();
              } else if (newUpdate.connection === "close") {
                handlers.onDisconnected("Connexion fermée après reconnexion");
              }
            });
          } catch {
            handlers.onError("Échec de reconnexion");
          }
        }, 1000);
      } else if (statusCode === DisconnectReason.loggedOut) {
        handlers.onDisconnected("Déconnecté de WhatsApp");
      } else if (!shouldReconnect) {
        handlers.onDisconnected("Connexion fermée");
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

  // Sauvegarder les credentials à chaque mise à jour
  socket.ev.on("creds.update", () => {
    // Les credentials sont mis à jour dans le state automatiquement
    console.log("Credentials mis à jour");
  });

  return { socket, saveState, cleanup };
};

/**
 * Se reconnecte avec des credentials existants (sans QR code)
 * Utiliser pour envoyer des messages
 */
export const connectWithCredentials = async (
  storedState: StoredAuthState,
): Promise<{
  socket: WASocket;
  saveState: () => StoredAuthState;
  waitForConnection: () => Promise<boolean>;
  cleanup: () => void;
}> => {
  const { state, saveState } = createDBAuthState(storedState);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Auto-Prospect", "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: createFilteredLogger() as any, // Suppress verbose Baileys logs
  });

  let connectionResolve: ((value: boolean) => void) | null = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    socket.end(undefined);
  };

  // Attend que la connexion soit établie (timeout 30s)
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

/** Envoie un message texte via WhatsApp (fonctions Baileys: onWhatsApp, sendMessage) */
export const sendWhatsAppMessage = async (
  socket: WASocket,
  phoneNumber: string, // Format: 33612345678 (sans +)
  message: string,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  console.log("dans sens hatsapp");
  try {
    const jid = `${phoneNumber}@s.whatsapp.net`;

    // Vérifier si le numéro existe sur WhatsApp
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

    // Envoyer le message et attendre la confirmation
    const sentMessage = await socket.sendMessage(result.jid, { text: message });
    console.log("Message envoyé:", sentMessage);
    console.log("Status initial:", sentMessage?.status);

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

/** Vérifie si un numéro existe sur WhatsApp (fonction Baileys: onWhatsApp) */
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
    return { exists: result.exists, jid: result.jid };
  } catch {
    return { exists: false };
  }
};

/**
 * Creates or updates the WhatsApp session for an account
 * Stores encrypted credentials as JSON
 */
export const saveWhatsAppSession = async (
  accountId: string,
  credentials: StoredAuthState,
  dbClient?: TDBClient,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = dbClient || (await createDrizzleSupabaseClient());

  const credentialsJson = JSON.stringify(credentials);

  try {
    await client.rls((tx) =>
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
        }),
    );
    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EWhatsAppErrorCode.SESSION_SAVE_FAILED,
    };
  }
};

/**
 * Updates the connection status of a WhatsApp session
 */
export const updateWhatsAppConnectionStatus = async (
  accountId: string,
  isConnected: boolean,
  options?: TDBOptions,
): Promise<{ success: boolean; errorCode?: TErrorCode }> => {
  const client = options?.dbClient || (await createDrizzleSupabaseClient());

  const query = (tx: TDBQuery) =>
    tx
      .update(whatsappSessions)
      .set({
        isConnected,
        lastConnectedAt: isConnected
          ? new Date()
          : whatsappSessions.lastConnectedAt,
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.accountId, accountId));

  try {
    if (options?.bypassRLS) await query(client.admin);
    else await client.rls(query);

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: EGeneralErrorCode.DATABASE_ERROR,
    };
  }
};

/**
 * Checks if an account has an active WhatsApp connection
 */
export const isWhatsAppConnected = async (
  accountId: string,
  options: TDBOptions = { bypassRLS: false },
): Promise<boolean> => {
  const { session } = await getWhatsAppSession(accountId, options);
  return session?.isConnected ?? false;
};
