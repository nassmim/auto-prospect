import { z } from "zod";

// Text template validation schema
export const textTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  channel: z.enum(["whatsapp", "sms", "leboncoin"] as const, {
    required_error: "Le canal est requis",
    invalid_type_error: "Canal invalide",
  }),
  content: z
    .string()
    .min(1, "Le contenu du message est requis")
    .max(2000, "Le contenu ne peut pas dépasser 2000 caractères"),
  isDefault: z.boolean(),
});

export type TextTemplateFormData = z.infer<typeof textTemplateSchema>;

// Voice template validation schema (server-side, after upload)
export const voiceTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  audioUrl: z.string().url("URL audio invalide"),
  audioDuration: z
    .number()
    .min(15, "La durée minimale est de 15 secondes")
    .max(55, "La durée maximale est de 55 secondes"),
  isDefault: z.boolean(),
});

export type VoiceTemplateFormData = z.infer<typeof voiceTemplateSchema>;

// Client-side voice template schema (before upload)
export const voiceTemplateClientSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  audioBlob: z.instanceof(Blob, {
    message: "Veuillez enregistrer ou importer un fichier audio",
  }),
  audioDuration: z
    .number()
    .min(15, "La durée minimale est de 15 secondes")
    .max(55, "La durée maximale est de 55 secondes"),
  isDefault: z.boolean(),
});

export type VoiceTemplateClientData = z.infer<
  typeof voiceTemplateClientSchema
>;
