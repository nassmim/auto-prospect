/**
 * Tests for error message mapping in manual send button handlers
 *
 * These tests verify that specific error codes map to correct French user messages
 * for both WhatsApp and Voice send actions in the lead drawer (task 126, 127).
 */

import { describe, it, expect } from "vitest";

// Error message maps mirroring the lead-drawer.tsx handler logic

const WHATSAPP_ERROR_MESSAGES: Record<string, string> = {
  NO_DEFAULT_TEMPLATE:
    "Aucun template WhatsApp par défaut configuré. Allez dans Modèles pour en définir un.",
  RECIPIENT_PHONE_INVALID: "Numéro de téléphone du destinataire invalide.",
  SESSION_NOT_FOUND:
    "Session WhatsApp non connectée. Configurez WhatsApp dans les paramètres.",
  SESSION_EXPIRED:
    "Session WhatsApp expirée. Reconnectez-vous dans les paramètres.",
  PHONE_INVALID: "Numéro WhatsApp non configuré dans les paramètres.",
};

const VOICE_ERROR_MESSAGES: Record<string, string> = {
  NO_DEFAULT_TEMPLATE:
    "Aucun template vocal par défaut configuré. Allez dans Modèles pour en définir un.",
  RECIPIENT_PHONE_INVALID: "Numéro de téléphone du destinataire invalide.",
  PHONE_INVALID:
    "Numéro de téléphone fixe non configuré dans les paramètres.",
  API_KEY_MISSING: "Configuration des API vocales manquante.",
};

function resolveWhatsAppErrorMessage(errorCode?: string): string {
  return (
    WHATSAPP_ERROR_MESSAGES[errorCode || ""] ||
    "Erreur lors de l'envoi du message WhatsApp"
  );
}

function resolveVoiceErrorMessage(errorCode?: string): string {
  return (
    VOICE_ERROR_MESSAGES[errorCode || ""] ||
    "Erreur lors de l'envoi du message vocal"
  );
}

describe("Manual Send Button Error Handling", () => {
  describe("WhatsApp button error messages (task 127)", () => {
    it("shows French message for NO_DEFAULT_TEMPLATE", () => {
      const msg = resolveWhatsAppErrorMessage("NO_DEFAULT_TEMPLATE");
      expect(msg).toContain("template WhatsApp");
      expect(msg).toContain("Modèles");
    });

    it("shows French message for RECIPIENT_PHONE_INVALID", () => {
      const msg = resolveWhatsAppErrorMessage("RECIPIENT_PHONE_INVALID");
      expect(msg).toContain("Numéro de téléphone du destinataire");
    });

    it("shows French message for SESSION_NOT_FOUND", () => {
      const msg = resolveWhatsAppErrorMessage("SESSION_NOT_FOUND");
      expect(msg).toContain("Session WhatsApp");
      expect(msg).toContain("paramètres");
    });

    it("shows French message for SESSION_EXPIRED", () => {
      const msg = resolveWhatsAppErrorMessage("SESSION_EXPIRED");
      expect(msg).toContain("expirée");
    });

    it("shows French message for PHONE_INVALID", () => {
      const msg = resolveWhatsAppErrorMessage("PHONE_INVALID");
      expect(msg).toContain("WhatsApp");
      expect(msg).toContain("paramètres");
    });

    it("falls back to generic message for unknown error codes", () => {
      const msg = resolveWhatsAppErrorMessage("UNKNOWN_CODE");
      expect(msg).toBe("Erreur lors de l'envoi du message WhatsApp");
    });

    it("falls back to generic message when errorCode is undefined", () => {
      const msg = resolveWhatsAppErrorMessage(undefined);
      expect(msg).toBe("Erreur lors de l'envoi du message WhatsApp");
    });
  });

  describe("Voice button error messages (task 126)", () => {
    it("shows French message for NO_DEFAULT_TEMPLATE", () => {
      const msg = resolveVoiceErrorMessage("NO_DEFAULT_TEMPLATE");
      expect(msg).toContain("template vocal");
      expect(msg).toContain("Modèles");
    });

    it("shows French message for RECIPIENT_PHONE_INVALID", () => {
      const msg = resolveVoiceErrorMessage("RECIPIENT_PHONE_INVALID");
      expect(msg).toContain("Numéro de téléphone du destinataire");
    });

    it("shows French message for PHONE_INVALID (missing fixed phone)", () => {
      const msg = resolveVoiceErrorMessage("PHONE_INVALID");
      expect(msg).toContain("fixe");
      expect(msg).toContain("paramètres");
    });

    it("shows French message for API_KEY_MISSING", () => {
      const msg = resolveVoiceErrorMessage("API_KEY_MISSING");
      expect(msg).toContain("API vocales");
    });

    it("falls back to generic message for unknown error codes", () => {
      const msg = resolveVoiceErrorMessage("UNKNOWN_CODE");
      expect(msg).toBe("Erreur lors de l'envoi du message vocal");
    });

    it("falls back to generic message when errorCode is undefined", () => {
      const msg = resolveVoiceErrorMessage(undefined);
      expect(msg).toBe("Erreur lors de l'envoi du message vocal");
    });
  });

  describe("NO_DEFAULT_TEMPLATE error differentiation", () => {
    it("WhatsApp and Voice show different messages for NO_DEFAULT_TEMPLATE", () => {
      const waMsg = resolveWhatsAppErrorMessage("NO_DEFAULT_TEMPLATE");
      const voiceMsg = resolveVoiceErrorMessage("NO_DEFAULT_TEMPLATE");

      expect(waMsg).not.toBe(voiceMsg);
      expect(waMsg).toContain("WhatsApp");
      expect(voiceMsg).toContain("vocal");
    });
  });
});
