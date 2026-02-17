/**
 * Message Configuration - SINGLE SOURCE OF TRUTH
 * All message-related enums, types, and configs
 */

// ============================================================================
// CHANNEL LIMITS
// ============================================================================

/**
 * WhatsApp messages are unlimited for users (competitive positioning)
 * Hard limit of 1000 per day per hunt to prevent abuse
 * This limit is auto-allocated when WhatsApp is enabled
 */
export const WHATSAPP_DAILY_LIMIT = 1000;

// ============================================================================
// CONTACT CHANNELS
// ============================================================================

export const CONTACT_CHANNEL_DEFINITIONS = [
  {
    key: "WHATSAPP_TEXT",
    value: "whatsapp_text",
    label: "Message WhatsApp",
    shortLabel: "WhatsApp",
    description: "Messages texte via WhatsApp Business",
    icon: "message-circle",
    color: "green",
  },
  // {
  //   key: "SMS",
  //   value: "sms",
  //   label: "SMS",
  //   shortLabel: "SMS",
  //   description: "Messages texte par SMS",
  //   icon: "message-square",
  //   color: "blue",
  // },
  {
    key: "RINGLESS_VOICE",
    value: "ringless_voice",
    label: "Message Vocal",
    shortLabel: "Vocal",
    description: "Messages vocaux sans sonnerie",
    icon: "phone",
    color: "purple",
  },
] as const;

// Enum-like constant access (e.g., EContactChannel.WHATSAPP_TEXT)
export const EContactChannel = Object.fromEntries(
  CONTACT_CHANNEL_DEFINITIONS.map((channel) => [channel.key, channel.value]),
) as {
  [K in (typeof CONTACT_CHANNEL_DEFINITIONS)[number]["key"]]: Extract<
    (typeof CONTACT_CHANNEL_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TContactChannel =
  (typeof CONTACT_CHANNEL_DEFINITIONS)[number]["value"];

export const CONTACT_CHANNEL_VALUES = CONTACT_CHANNEL_DEFINITIONS.map(
  (c) => c.value,
) as [TContactChannel, ...TContactChannel[]];

export const getContactChannelConfig = (channel: string) => {
  const config = CONTACT_CHANNEL_DEFINITIONS.find((c) => c.value === channel);
  if (!config) throw new Error(`Invalid contact channel: ${channel}`);
  return config;
};

export const getContactChannelLabel = (channel: string): string => {
  return getContactChannelConfig(channel).label;
};

// ============================================================================
// MESSAGE STATUSES
// ============================================================================

export const MESSAGE_STATUS_DEFINITIONS = [
  {
    key: "PENDING",
    value: "pending",
    label: "En attente",
    description: "Message en file d'attente",
    icon: "clock",
    color: "#eab308",
    class: "bg-yellow-900/30 text-yellow-400 border-yellow-900/50",
  },
  {
    key: "SENT",
    value: "sent",
    label: "Envoyé",
    description: "Message envoyé avec succès",
    icon: "send",
    color: "#3b82f6",
    class: "bg-blue-900/30 text-blue-400 border-blue-900/50",
  },
  {
    key: "DELIVERED",
    value: "delivered",
    label: "Délivré",
    description: "Message délivré au destinataire",
    icon: "check",
    color: "#22c55e",
    class: "bg-green-900/30 text-green-400 border-green-900/50",
  },
  {
    key: "FAILED",
    value: "failed",
    label: "Échoué",
    description: "Échec de l'envoi",
    icon: "x",
    color: "#ef4444",
    class: "bg-red-900/30 text-red-400 border-red-900/50",
  },
  {
    key: "READ",
    value: "read",
    label: "Lu",
    description: "Message lu par le destinataire",
    icon: "check-check",
    color: "#a855f7",
    class: "bg-purple-900/30 text-purple-400 border-purple-900/50",
  },
  {
    key: "REPLIED",
    value: "replied",
    label: "Répondu",
    description: "Destinataire a répondu",
    icon: "reply",
    color: "#10b981",
    class: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
  },
] as const;

// Enum-like constant access (e.g., EMessageStatus.SENT)
export const EMessageStatus = Object.fromEntries(
  MESSAGE_STATUS_DEFINITIONS.map((status) => [status.key, status.value]),
) as {
  [K in (typeof MESSAGE_STATUS_DEFINITIONS)[number]["key"]]: Extract<
    (typeof MESSAGE_STATUS_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TMessageStatus =
  (typeof MESSAGE_STATUS_DEFINITIONS)[number]["value"];

export const MESSAGE_STATUS_VALUES = MESSAGE_STATUS_DEFINITIONS.map(
  (s) => s.value,
) as [TMessageStatus, ...TMessageStatus[]];

export const getMessageStatusConfig = (status: string) => {
  const config = MESSAGE_STATUS_DEFINITIONS.find((s) => s.value === status);
  if (!config) throw new Error(`Invalid message status: ${status}`);
  return config;
};

export const getMessageStatusLabel = (status: TMessageStatus): string => {
  return getMessageStatusConfig(status).label;
};
