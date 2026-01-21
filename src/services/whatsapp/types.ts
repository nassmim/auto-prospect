import type { ConnectionState } from "@whiskeysockets/baileys";

export type WhatsappConnectionStatus = "pending" | "connecting" | "connected" | "disconnected";

export type WhatsappConnection = {
  accountId: string;
  phoneNumber: string;
  status: WhatsappConnectionStatus;
  qrCode?: string;
};

export type ConnectionUpdateCallback = (update: {
  qrCode?: string;
  status: WhatsappConnectionStatus;
  connection?: ConnectionState["connection"];
}) => void;
