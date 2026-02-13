/**
 * @auto-prospect/whatsapp
 *
 * Shared WhatsApp (Baileys) integration package
 * Provides core functionality for both web app and worker:
 * - Auth state management with database storage
 * - Auth state management & Connection handling (QR code and credential-based)
 * - Message sending and phone number validation
 */

export * from "./connection";
export * from "./messaging";
export * from "./types";
