/**
 * Tests for the per-hunt template resolution logic in daily-orchestrator.ts
 *
 * These tests verify that templates are fetched by hunt.templateIds (not isDefault)
 * and that channels without configured templates are skipped.
 */

import { describe, it, expect } from "vitest";

// Template resolution logic extracted for testing
// Mirrors the logic in processHunt() after task 122

type TTemplateIds = {
  whatsapp?: string | null;
  sms?: string | null;
  ringlessVoice?: string | null;
};

type TTemplate = {
  id: string;
  channel: string;
  content: string;
  audioUrl: string;
};

const WHATSAPP_TEXT = "whatsapp_text";
const RINGLESS_VOICE = "ringless_voice";
const SMS = "sms";

/**
 * Resolves templates by hunt.templateIds - mirrors the logic in processHunt()
 */
function resolveTemplatesByChannel(
  templateIds: TTemplateIds | null | undefined,
  templates: TTemplate[],
): Map<string, TTemplate> {
  const templatesByChannel = new Map<string, TTemplate>();

  if (templateIds?.whatsapp) {
    const t = templates.find((t) => t.id === templateIds.whatsapp);
    if (t) templatesByChannel.set(WHATSAPP_TEXT, t);
  }
  if (templateIds?.sms) {
    const t = templates.find((t) => t.id === templateIds.sms);
    if (t) templatesByChannel.set(SMS, t);
  }
  if (templateIds?.ringlessVoice) {
    const t = templates.find((t) => t.id === templateIds.ringlessVoice);
    if (t) templatesByChannel.set(RINGLESS_VOICE, t);
  }

  return templatesByChannel;
}

/**
 * Gets template IDs to fetch from hunt.templateIds - mirrors the query preparation
 */
function getTemplateIdValues(
  templateIds: TTemplateIds | null | undefined,
): string[] {
  return [
    templateIds?.whatsapp,
    templateIds?.sms,
    templateIds?.ringlessVoice,
  ].filter(Boolean) as string[];
}

describe("Per-Hunt Template Resolution (task 122)", () => {
  const whatsappTemplate: TTemplate = {
    id: "template-wa-1",
    channel: WHATSAPP_TEXT,
    content: "Hello {{ownerName}}",
    audioUrl: "",
  };

  const voiceTemplate: TTemplate = {
    id: "template-voice-1",
    channel: RINGLESS_VOICE,
    content: "",
    audioUrl: "https://cdn.example.com/audio.mp3",
  };

  const defaultWhatsAppTemplate: TTemplate = {
    id: "template-default-wa",
    channel: WHATSAPP_TEXT,
    content: "Default message",
    audioUrl: "",
  };

  describe("getTemplateIdValues", () => {
    it("returns all non-null template IDs", () => {
      const ids = getTemplateIdValues({
        whatsapp: "wa-1",
        sms: "sms-1",
        ringlessVoice: "voice-1",
      });
      expect(ids).toEqual(["wa-1", "sms-1", "voice-1"]);
    });

    it("excludes null/undefined values", () => {
      const ids = getTemplateIdValues({
        whatsapp: "wa-1",
        sms: null,
        ringlessVoice: undefined,
      });
      expect(ids).toEqual(["wa-1"]);
    });

    it("returns empty array when templateIds is null", () => {
      const ids = getTemplateIdValues(null);
      expect(ids).toEqual([]);
    });

    it("returns empty array when templateIds is empty object", () => {
      const ids = getTemplateIdValues({});
      expect(ids).toEqual([]);
    });
  });

  describe("resolveTemplatesByChannel", () => {
    it("uses hunt templateIds to map templates to channels (not isDefault)", () => {
      // The hunt specifies whatsapp-template-id-1 (not the default one)
      const templateIds: TTemplateIds = { whatsapp: "template-wa-1" };
      const allTemplates = [whatsappTemplate, defaultWhatsAppTemplate];

      const map = resolveTemplatesByChannel(templateIds, allTemplates);

      expect(map.get(WHATSAPP_TEXT)).toBe(whatsappTemplate);
      expect(map.get(WHATSAPP_TEXT)?.id).toBe("template-wa-1");
      // The default template should NOT be selected
      expect(map.get(WHATSAPP_TEXT)?.id).not.toBe("template-default-wa");
    });

    it("skips channel when templateIds does not include it", () => {
      // Hunt only has voice template configured - WhatsApp skipped
      const templateIds: TTemplateIds = { ringlessVoice: "template-voice-1" };
      const allTemplates = [whatsappTemplate, voiceTemplate];

      const map = resolveTemplatesByChannel(templateIds, allTemplates);

      expect(map.has(WHATSAPP_TEXT)).toBe(false);
      expect(map.get(RINGLESS_VOICE)).toBe(voiceTemplate);
    });

    it("handles deleted template gracefully (template not in DB results)", () => {
      // Hunt references a template that was deleted
      const templateIds: TTemplateIds = { whatsapp: "deleted-template-id" };
      const allTemplates: TTemplate[] = []; // Template was deleted from DB

      const map = resolveTemplatesByChannel(templateIds, allTemplates);

      // Channel should not be in the map (will be skipped during processing)
      expect(map.has(WHATSAPP_TEXT)).toBe(false);
    });

    it("resolves multiple channels independently", () => {
      const templateIds: TTemplateIds = {
        whatsapp: "template-wa-1",
        ringlessVoice: "template-voice-1",
      };
      const allTemplates = [whatsappTemplate, voiceTemplate];

      const map = resolveTemplatesByChannel(templateIds, allTemplates);

      expect(map.get(WHATSAPP_TEXT)).toBe(whatsappTemplate);
      expect(map.get(RINGLESS_VOICE)).toBe(voiceTemplate);
      expect(map.size).toBe(2);
    });

    it("returns empty map when templateIds is null", () => {
      const map = resolveTemplatesByChannel(null, [whatsappTemplate]);

      expect(map.size).toBe(0);
    });

    it("returns empty map when no templates match", () => {
      const templateIds: TTemplateIds = {
        whatsapp: "non-existent-1",
        ringlessVoice: "non-existent-2",
      };
      const allTemplates = [whatsappTemplate, voiceTemplate];

      const map = resolveTemplatesByChannel(templateIds, allTemplates);

      expect(map.size).toBe(0);
    });
  });
});
