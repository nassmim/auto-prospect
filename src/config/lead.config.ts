/**
 * Lead Configuration - SINGLE SOURCE OF TRUTH
 * All lead-related enums, types, and configs
 */

// ============================================================================
// LEAD STAGES
// ============================================================================

const LEAD_STAGE_DEFINITIONS = [
  {
    key: "NOUVEAU",
    value: "nouveau",
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "blue",
    icon: "star",
  },
  {
    key: "CONTACTE",
    value: "contacte",
    label: "Contacté",
    description: "Premier contact établi",
    color: "purple",
    icon: "message",
  },
  {
    key: "RELANCE",
    value: "relance",
    label: "Relance",
    description: "En attente de réponse",
    color: "orange",
    icon: "clock",
  },
  {
    key: "GAGNE",
    value: "gagne",
    label: "Gagné",
    description: "Vente conclue",
    color: "green",
    icon: "check",
  },
  {
    key: "PERDU",
    value: "perdu",
    label: "Perdu",
    description: "Opportunité perdue",
    color: "red",
    icon: "x",
  },
] as const;

export const LEAD_STAGE_CONFIG = Object.fromEntries(
  LEAD_STAGE_DEFINITIONS.map((stage) => [stage.key, stage]),
) as {
  [K in (typeof LEAD_STAGE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof LEAD_STAGE_DEFINITIONS)[number],
    { key: K }
  >;
};

export const ELeadStage = Object.fromEntries(
  LEAD_STAGE_DEFINITIONS.map((stage) => [stage.key, stage.value]),
) as {
  [K in (typeof LEAD_STAGE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof LEAD_STAGE_DEFINITIONS)[number],
    { key: K }
  >["value"];
};

export type TLeadStage = (typeof LEAD_STAGE_DEFINITIONS)[number]["value"];

export const LEAD_STAGES = LEAD_STAGE_DEFINITIONS;
export const LEAD_STAGE_VALUES = LEAD_STAGE_DEFINITIONS.map((s) => s.value);

export const getLeadStageConfig = (stage: TLeadStage) => {
  const config = LEAD_STAGE_DEFINITIONS.find((s) => s.value === stage);
  if (!config) throw new Error(`Invalid lead stage: ${stage}`);
  return config;
};

export const getLeadStageLabel = (stage: TLeadStage): string => {
  return getLeadStageConfig(stage).label;
};

// ============================================================================
// LEAD ACTIVITY TYPES
// ============================================================================

const LEAD_ACTIVITY_TYPE_DEFINITIONS = [
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

export const LEAD_ACTIVITY_TYPE_CONFIG = Object.fromEntries(
  LEAD_ACTIVITY_TYPE_DEFINITIONS.map((type) => [type.key, type]),
) as {
  [K in (typeof LEAD_ACTIVITY_TYPE_DEFINITIONS)[number]["key"]]: Extract<
    (typeof LEAD_ACTIVITY_TYPE_DEFINITIONS)[number],
    { key: K }
  >;
};

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

export const LEAD_ACTIVITY_TYPES = LEAD_ACTIVITY_TYPE_DEFINITIONS;
export const LEAD_ACTIVITY_TYPE_VALUES = LEAD_ACTIVITY_TYPE_DEFINITIONS.map(
  (t) => t.value,
);

export const getLeadActivityTypeConfig = (type: TLeadActivityType) => {
  const config = LEAD_ACTIVITY_TYPE_DEFINITIONS.find((t) => t.value === type);
  if (!config) throw new Error(`Invalid lead activity type: ${type}`);
  return config;
};

export const getLeadActivityTypeLabel = (type: TLeadActivityType): string => {
  return getLeadActivityTypeConfig(type).label;
};
