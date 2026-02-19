import {
  EAccountErrorCode,
  EAuthErrorCode,
  EGeneralErrorCode,
  ELeadErrorCode,
  EMessageErrorCode,
  ESmsErrorCode,
  EWhatsAppErrorCode,
  EWorkerErrorCode,
  TErrorCode,
} from "@auto-prospect/shared/src/config/error-codes";

/**
 * Error messages mapping for WhatsApp errors
 * Maps error codes to user-friendly French messages
 */
const WHATSAPP_ERROR_MESSAGES: Record<EWhatsAppErrorCode, string> = {
  // Phone number validation errors
  [EWhatsAppErrorCode.PHONE_REQUIRED]: "Renseigne ton numéro de téléphone",

  // Connection errors
  [EWhatsAppErrorCode.CONNECTION_TIMEOUT]:
    "La connexion a pris trop de temps. Réessaie.",
  [EWhatsAppErrorCode.CONNECTION_FAILED]: "Échec de connexion WhatsApp",
  [EWhatsAppErrorCode.QR_GENERATION_FAILED]:
    "Impossible de générer le QR code. Réessaie.",

  // Session errors
  [EWhatsAppErrorCode.SESSION_NOT_FOUND]:
    "Session WhatsApp non trouvée. Essaie de te reconnecter ou contacte-nous si le problème persiste.",
  [EWhatsAppErrorCode.SESSION_EXPIRED]:
    "Session WhatsApp expirée. Essaie de te reconnecter ou contacte-nous si le problème persiste.",
  [EWhatsAppErrorCode.SESSION_SAVE_FAILED]: "Échec de sauvegarde de la session",
  [EWhatsAppErrorCode.SESSION_DELETE_FAILED]:
    "Échec de suppression de la session",
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
  [EGeneralErrorCode.NOT_FOUND]: "La ressource demandée n'a pas été trouvée",
  [EGeneralErrorCode.FORBIDDEN]: "Tu n'as pas accès à cette ressource",
  [EGeneralErrorCode.RATE_LIMITED]:
    "Trop de requêtes. Réessaie dans quelques instants.",
  [EGeneralErrorCode.SERVER_ERROR]:
    "Une erreur serveur est survenue. Réessaie plus tard.",
};

/**
 * Error messages mapping for general errors
 */
const ACCOUNT_ERROR_MESSAGES: Record<EAccountErrorCode, string> = {
  [EAccountErrorCode.ACCOUNT_NOT_FOUND]:
    "Ton compte n'a pas été trouvé. Essaie de te connecter de nouveau. Si le problème persiste, contacte-nous",
  [EAccountErrorCode.PHONE_INVALID]:
    "Ton numéro de téléphone renseigné n'est pas valide",
};

/**
 * Error messages mapping for general errors
 */
const MESSAGE_ERROR_MESSAGES: Record<EMessageErrorCode, string> = {
  [EMessageErrorCode.MESSAGE_SEND_FAILED]: "Échec de l'envoi du message",
};

/**
 * Error messages mapping for lead errors
 */
const Lead_ERROR_MESSAGES: Record<ELeadErrorCode, string> = {
  [ELeadErrorCode.LEAD_NOT_FOUND]: "Cette annonce n'existe plus.",
  [ELeadErrorCode.RECIPIENT_PHONE_INVALID]:
    "Le numéro du destinataire n'est pas valide",
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
 * Error messages mapping for Auth errors
 * Maps error codes to user-friendly French messages
 */
const AUTH_ERROR_MESSAGES: Record<EAuthErrorCode, string> = {
  [EAuthErrorCode.SIGNUP_NOT_ALLOWED]:
    "Tu n'es pas encore inscrit. Réserve un appel avec notre équipe.",
  [EAuthErrorCode.AUTH_ERROR]:
    "Une erreur est survenue. Ré-essaie ou contacte-nous pour qu'on résolve le problème.",
  [EAuthErrorCode.EMAIL_INVALID]: "L'email ne semble pas valide",
};

/**
 * Error messages mapping for Worker API errors
 * Maps error codes to user-friendly French messages
 */
const WORKER_API_ERROR_MESSAGES: Record<EWorkerErrorCode, string> = {
  // Queue errors
  [EWorkerErrorCode.HUNT_EXECUTION_FAILED]:
    "Échec de l'exécution de la chasse. Réessaie.",
  [EWorkerErrorCode.HUNT_STATUS_FETCH_FAILED]:
    "Impossible de récupérer le statut. Réessaie.",
  [EWorkerErrorCode.SMS_QUEUE_FAILED]: "Échec de l'envoi du SMS. Réessaie.",
  [EWorkerErrorCode.VOICE_QUEUE_FAILED]:
    "Échec de l'envoi du message vocal. Réessaie.",
  [EWorkerErrorCode.WHATSAPP_QUEUE_FAILED]:
    "Échec de l'envoi WhatsApp. Réessaie.",
  [EWorkerErrorCode.JOB_STATUS_FETCH_FAILED]:
    "Impossible de récupérer le statut du job. Réessaie.",
  [EWorkerErrorCode.QUEUE_STATS_FETCH_FAILED]:
    "Impossible de récupérer les statistiques. Réessaie.",

  // Validation errors
  [EWorkerErrorCode.MISSING_REQUIRED_FIELDS]:
    "Informations manquantes. Vérifie les données.",
  [EWorkerErrorCode.INVALID_QUEUE_NAME]: "Nom de file invalide",
  [EWorkerErrorCode.JOB_NOT_FOUND]: "Job introuvable",
  [EWorkerErrorCode.QUEUE_NOT_FOUND]: "File introuvable",
};

/**
 * Complete error messages mapping
 */
const ERROR_MESSAGES: Record<TErrorCode, string> = {
  ...WHATSAPP_ERROR_MESSAGES,
  ...GENERAL_ERROR_MESSAGES,
  ...SMS_ERROR_MESSAGES,
  ...AUTH_ERROR_MESSAGES,
  ...WORKER_API_ERROR_MESSAGES,
  ...Lead_ERROR_MESSAGES,
  ...MESSAGE_ERROR_MESSAGES,
  ...ACCOUNT_ERROR_MESSAGES,
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
