import {
  EGeneralErrorCode,
  ESmsErrorCode,
  EWhatsAppErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";

/**
 * Error messages mapping for WhatsApp errors
 * Maps error codes to user-friendly French messages
 */
const WHATSAPP_ERROR_MESSAGES: Record<EWhatsAppErrorCode, string> = {
  // Phone number validation errors
  [EWhatsAppErrorCode.PHONE_REQUIRED]: "Renseigne ton numéro de téléphone",
  [EWhatsAppErrorCode.PHONE_INVALID_FORMAT]:
    "Ton numéro n'est pas valide, vérifie le format",
  [EWhatsAppErrorCode.PHONE_UPDATE_FAILED]: "Échec de mise à jour du numéro",

  // Connection errors
  [EWhatsAppErrorCode.CONNECTION_TIMEOUT]:
    "La connexion a pris trop de temps. Réessaie.",
  [EWhatsAppErrorCode.CONNECTION_FAILED]: "Échec de connexion WhatsApp",
  [EWhatsAppErrorCode.QR_GENERATION_FAILED]:
    "Impossible de générer le QR code. Réessaie.",

  // Session errors
  [EWhatsAppErrorCode.SESSION_NOT_FOUND]:
    "Session WhatsApp non trouvée. Veuillez vous reconnecter.",
  [EWhatsAppErrorCode.SESSION_EXPIRED]:
    "Session WhatsApp expirée. Veuillez vous reconnecter.",
  [EWhatsAppErrorCode.SESSION_SAVE_FAILED]: "Échec de sauvegarde de la session",
  [EWhatsAppErrorCode.SESSION_DELETE_FAILED]:
    "Échec de suppression de la session",

  // Account errors
  [EWhatsAppErrorCode.ACCOUNT_NOT_FOUND]:
    "Ton compte n'a pas été trouvé. Essaie de te connecter de nouveau. Si le problème persiste, contacte-nous",

  // Message sending errors
  [EWhatsAppErrorCode.MESSAGE_SEND_FAILED]: "Échec de l'envoi du message",
  [EWhatsAppErrorCode.RECIPIENT_INVALID]:
    "Le numéro du destinataire n'est pas valide",
};

/**
 * Error messages mapping for general errors
 */
const GENERAL_ERROR_MESSAGES: Record<EGeneralErrorCode, string> = {
  [EGeneralErrorCode.VALIDATION_FAILED]: "Données invalides",
  [EGeneralErrorCode.UNAUTHORIZED]: "Non autorisé",
  [EGeneralErrorCode.DATABASE_ERROR]:
    "Erreur de base de données. Réessaie plus tard.",
  [EGeneralErrorCode.UNKNOWN_ERROR]: "Une erreur inattendue s'est produite",
};

/**
 * Error messages mapping for SMS errors
 * Maps error codes to user-friendly French messages
 */
const SMS_ERROR_MESSAGES: Record<ESmsErrorCode, string> = {
  // API Key errors
  [ESmsErrorCode.API_KEY_REQUIRED]:
    "Configure d'abord ta clé API pour envoyer des SMS",
  [ESmsErrorCode.API_KEY_INVALID]: "Ta clé API n'est pas valide",
  [ESmsErrorCode.API_KEY_SAVE_FAILED]:
    "Échec de sauvegarde de la clé API. Réessaie.",
  [ESmsErrorCode.ENCRYPTION_KEY_MISSING]:
    "Erreur de configuration du serveur. Contacte-nous.",

  // Phone number errors
  [ESmsErrorCode.PHONE_NUMBER_REQUIRED]: "Renseigne le numéro du destinataire",
  [ESmsErrorCode.PHONE_NUMBER_INVALID]:
    "Le numéro du destinataire n'est pas valide",

  // Message errors
  [ESmsErrorCode.MESSAGE_REQUIRED]: "Renseigne le message à envoyer",
  [ESmsErrorCode.MESSAGE_SEND_FAILED]: "Échec de l'envoi du SMS. Réessaie.",

  // Account errors
  [ESmsErrorCode.ACCOUNT_NOT_FOUND]:
    "Ton compte n'a pas été trouvé. Essaie de te connecter de nouveau.",
};

/**
 * Complete error messages mapping
 */
const ERROR_MESSAGES: Record<TErrorCode, string> = {
  ...WHATSAPP_ERROR_MESSAGES,
  ...GENERAL_ERROR_MESSAGES,
  ...SMS_ERROR_MESSAGES,
};

/**
 * Gets the user-friendly error message for an error code
 * @param errorCode - The error code from the server
 * @returns The user-friendly error message in French
 */
export const getErrorMessage = (errorCode: TErrorCode): string => {
  return (
    ERROR_MESSAGES[errorCode] ||
    GENERAL_ERROR_MESSAGES[EGeneralErrorCode.UNKNOWN_ERROR]
  );
};
