/**
 * @auto-prospect/whatsapp
 *
 * Shared WhatsApp (Baileys) integration package
 * Provides core functionality for both web app and worker:
 * - Auth state management with database storage
 * - Connection handling (QR code and credential-based)
 * - Message sending and phone number validation
 */

// Types
export * from "./types";

// Auth state management
export * from "./auth";

// Connection handling
export * from "./connection";

// Messaging
export * from "./messaging";
