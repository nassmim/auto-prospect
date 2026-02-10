/**
 * WhatsApp Authentication State Management
 * Handles Baileys auth state with database storage instead of file system
 */

import {
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { decryptCredentials, encryptCredentials } from "@auto-prospect/shared";
import { StoredAuthState } from "./types";

const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY!;

/**
 * Creates a Baileys-compatible auth state with database storage
 * Loads and decrypts existing credentials, or creates new ones
 * Returns saveState() to persist after connection
 */
export const createDBAuthState = (
  storedState: StoredAuthState | null,
): {
  state: AuthenticationState;
  saveState: () => StoredAuthState;
} => {
  let creds = initAuthCreds();
  let keys: Record<string, Record<string, unknown>> = {};

  // Load existing credentials if available
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
      console.error("Failed to decrypt credentials:", error);
      creds = initAuthCreds();
      keys = {};
    }
  }

  // Format expected by Baileys
  const state: AuthenticationState = {
    creds,
    keys: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (type: any, ids: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};
        for (const id of ids) {
          const value = keys[type]?.[id];
          if (value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data[id] = value as any;
          }
        }
        return data;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (data: any) => {
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

  // Returns encrypted credentials for DB storage
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
