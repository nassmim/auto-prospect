/**
 * Lead Configuration - SINGLE SOURCE OF TRUTH
 * All lead-related enums, types, and configs
 */

// ============================================================================
// LEAD STAGES
// ============================================================================

export const LEAD_STAGE_DEFINITIONS = [
  {
    key: "NEW",
    value: "new",
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "#3b82f6",
    class: "bg-blue-900/30 text-blue-400 border-blue-900/50",
    icon: "star",
  },
  {
    key: "CONTACTED",
    value: "contacted",
    label: "Contacté",
    description: "Premier contact établi",
    color: "#8b5cf6",
    class: "bg-purple-900/30 text-purple-400 border-purple-900/50",
    icon: "message",
  },
  {
    key: "CHASED",
    value: "chased",
    label: "Relance",
    description: "En attente de réponse",
    color: "#f59e0b",
    class: "bg-orange-900/30 text-orange-400 border-orange-900/50",
    icon: "clock",
  },
  {
    key: "WON",
    value: "won",
    label: "Gagné",
    description: "Vente conclue",
    color: "#22c55e",
    class: "bg-green-900/30 text-green-400 border-green-900/50",
    icon: "check",
  },
  {
    key: "LOST",
    value: "lost",
    label: "Perdu",
    description: "Opportunité perdue",
    color: "#ef4444",
    class: "bg-red-900/30 text-red-400 border-red-900/50",
    icon: "x",
  },
] as const;

// Enum-like constant access (e.g., ELeadStage.CONTACTE)
export const ELeadStage = Object.fromEntries(
  LEAD_STAGE_DEFINITIONS.map((stage) => [stage.key, stage.value]),
) as {
  [K in (typeof LEAD_STAGE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof LEAD_STAGE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TLeadStage = (typeof LEAD_STAGE_DEFINITIONS)[number]["value"];

// Array of values for Drizzle pgEnum
export const LEAD_STAGE_VALUES = LEAD_STAGE_DEFINITIONS.map((s) => s.value) as [
  TLeadStage,
  ...TLeadStage[],
];

export const getLeadStageConfig = (stage: TLeadStage) => {
  const config = LEAD_STAGE_DEFINITIONS.find((s) => s.value === stage);
  if (!config) throw new Error(`Invalid lead stage: ${stage}`);
  return config;
};

// ============================================================================
// LEAD ACTIVITY TYPES
// ============================================================================

export const LEAD_ACTIVITY_TYPE_DEFINITIONS = [
  {
    key: "STAGE_CHANGE",
    value: "stage_change",
    label: "Changement d'étape",
    description: "Le lead a changé d'étape",
    icon: "arrow-right",
    color: "blue",
  },
  {
    key: "MESSAGE_SENT",
    value: "message_sent",
    label: "Message envoyé",
    description: "Un message a été envoyé au lead",
    icon: "send",
    color: "green",
  },
  {
    key: "ASSIGNMENT_CHANGE",
    value: "assignment_change",
    label: "Changement d'assignation",
    description: "Le lead a été assigné à un autre utilisateur",
    icon: "user",
    color: "purple",
  },
  {
    key: "NOTE_ADDED",
    value: "note_added",
    label: "Note ajoutée",
    description: "Une note a été ajoutée au lead",
    icon: "file-text",
    color: "orange",
  },
  {
    key: "REMINDER_SET",
    value: "reminder_set",
    label: "Rappel défini",
    description: "Un rappel a été créé",
    icon: "bell",
    color: "yellow",
  },
  {
    key: "CREATED",
    value: "created",
    label: "Créé",
    description: "Le lead a été créé",
    icon: "plus",
    color: "gray",
  },
] as const;

// Enum-like constant access (e.g., ELeadActivityType.MESSAGE_SENT)
export const ELeadActivityType = Object.fromEntries(
  LEAD_ACTIVITY_TYPE_DEFINITIONS.map((type) => [type.key, type.value]),
) as {
  [K in (typeof LEAD_ACTIVITY_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof LEAD_ACTIVITY_TYPE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TLeadActivityType =
  (typeof LEAD_ACTIVITY_TYPE_DEFINITIONS)[number]["value"];

// Array of values for Drizzle pgEnum
export const LEAD_ACTIVITY_TYPE_VALUES = LEAD_ACTIVITY_TYPE_DEFINITIONS.map(
  (t) => t.value,
) as [TLeadActivityType, ...TLeadActivityType[]];

export const getLeadActivityTypeConfig = (type: TLeadActivityType) => {
  const config = LEAD_ACTIVITY_TYPE_DEFINITIONS.find((t) => t.value === type);
  if (!config) throw new Error(`Invalid lead activity type: ${type}`);
  return config;
};
