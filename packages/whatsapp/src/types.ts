/**
 * WhatsApp Package Types
 * Shared types for Baileys integration across web and worker
 */

import { WASocket } from "@whiskeysockets/baileys";

/** Credentials stored in DB (encrypted) */
export type StoredAuthState = {
  creds: string;
  keys: string;
};

/** Result of a WhatsApp connection attempt */
export type WhatsAppConnectionResult = {
  success: boolean;
  error?: string;
  qrCode?: string;
  isConnected?: boolean;
};

/** Callbacks for handling connection events */
export type WhatsAppEventHandlers = {
  onQRCode: (qrDataUrl: string) => void;
  onConnected: () => void;
  onDisconnected: (reason: string) => void;
  onError: (error: string) => void;
};

/** Result of connecting with existing credentials */
export type CredentialConnectionResult = {
  socket: WASocket;
  saveState: () => StoredAuthState;
  waitForConnection: () => Promise<boolean>;
  cleanup: () => void;
};

/** Result of creating a new connection with QR code */
export type QRConnectionResult = {
  socket: WASocket;
  saveState: () => StoredAuthState;
  cleanup: () => void;
};
