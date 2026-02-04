/**
 * Message Configuration - SINGLE SOURCE OF TRUTH
 * All message-related enums, types, and configs
 */

// ============================================================================
// CONTACT CHANNELS
// ============================================================================

const CONTACT_CHANNEL_DEFINITIONS = [
  {
    key: "WHATSAPP_TEXT",
    value: "whatsappText",
    label: "Message WhatsApp",
    shortLabel: "WhatsApp",
    description: "Messages texte via WhatsApp Business",
    icon: "message-circle",
    color: "green",
  },
  {
    key: "SMS",
    value: "sms",
    label: "SMS",
    shortLabel: "SMS",
    description: "Messages texte par SMS",
    icon: "message-square",
    color: "blue",
  },
  {
    key: "RINGLESS_VOICE",
    value: "ringlessVoice",
    label: "Message Vocal",
    shortLabel: "Vocal",
    description: "Messages vocaux sans sonnerie",
    icon: "phone",
    color: "purple",
  },
] as const;

export const CONTACT_CHANNEL_CONFIG = Object.fromEntries(
  CONTACT_CHANNEL_DEFINITIONS.map((channel) => [channel.key, channel]),
) as {
  [K in (typeof CONTACT_CHANNEL_DEFINITIONS)[number]["key"]]: Extract<
    (typeof CONTACT_CHANNEL_DEFINITIONS)[number],
    { key: K }
  >;
};

export const EContactChannel = Object.fromEntries(
  CONTACT_CHANNEL_DEFINITIONS.map((channel) => [channel.key, channel.value]),
) as {
  [K in (typeof CONTACT_CHANNEL_DEFINITIONS)[number]["key"]]: Extract<
    (typeof CONTACT_CHANNEL_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TContactChannel = (typeof CONTACT_CHANNEL_DEFINITIONS)[number]["value"];

export const CONTACT_CHANNELS = CONTACT_CHANNEL_DEFINITIONS;
export const CONTACT_CHANNEL_VALUES = CONTACT_CHANNEL_DEFINITIONS.map((c) => c.value);

export const getContactChannelConfig = (channel: TContactChannel) => {
  const config = CONTACT_CHANNEL_DEFINITIONS.find((c) => c.value === channel);
  if (!config) throw new Error(`Invalid contact channel: ${channel}`);
  return config;
};

export const getContactChannelLabel = (channel: TContactChannel): string => {
  return getContactChannelConfig(channel).label;
};

// ============================================================================
// MESSAGE STATUSES
// ============================================================================

const MESSAGE_STATUS_DEFINITIONS = [
  {
    key: "PENDING",
    value: "pending",
    label: "En attente",
    description: "Message en file d'attente",
    icon: "clock",
    color: "gray",
  },
  {
    key: "SENT",
    value: "sent",
    label: "Envoyé",
    description: "Message envoyé avec succès",
    icon: "send",
    color: "blue",
  },
  {
    key: "DELIVERED",
    value: "delivered",
    label: "Délivré",
    description: "Message délivré au destinataire",
    icon: "check",
    color: "green",
  },
  {
    key: "FAILED",
    value: "failed",
    label: "Échoué",
    description: "Échec de l'envoi",
    icon: "x",
    color: "red",
  },
  {
    key: "READ",
    value: "read",
    label: "Lu",
    description: "Message lu par le destinataire",
    icon: "check-check",
    color: "green",
  },
  {
    key: "REPLIED",
    value: "replied",
    label: "Répondu",
    description: "Destinataire a répondu",
    icon: "reply",
    color: "purple",
  },
] as const;

export const MESSAGE_STATUS_CONFIG = Object.fromEntries(
  MESSAGE_STATUS_DEFINITIONS.map((status) => [status.key, status]),
) as {
  [K in (typeof MESSAGE_STATUS_DEFINITIONS)[number]["key"]]: Extract<
    (typeof MESSAGE_STATUS_DEFINITIONS)[number],
    { key: K }
  >;
};

export const EMessageStatus = Object.fromEntries(
  MESSAGE_STATUS_DEFINITIONS.map((status) => [status.key, status.value]),
) as {
  [K in (typeof MESSAGE_STATUS_DEFINITIONS)[number]["key"]]: Extract<
    (typeof MESSAGE_STATUS_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TMessageStatus = (typeof MESSAGE_STATUS_DEFINITIONS)[number]["value"];

export const MESSAGE_STATUSES = MESSAGE_STATUS_DEFINITIONS;
export const MESSAGE_STATUS_VALUES = MESSAGE_STATUS_DEFINITIONS.map(
  (s) => s.value,
);

export const getMessageStatusConfig = (status: TMessageStatus) => {
  const config = MESSAGE_STATUS_DEFINITIONS.find((s) => s.value === status);
  if (!config) throw new Error(`Invalid message status: ${status}`);
  return config;
};

export const getMessageStatusLabel = (status: TMessageStatus): string => {
  return getMessageStatusConfig(status).label;
};
