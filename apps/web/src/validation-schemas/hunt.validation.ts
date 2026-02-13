import { z } from "zod";

// Outreach settings schema
const outreachSettingsSchema = z
  .object({
    leboncoin: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    sms: z.boolean().optional(),
    ringlessVoice: z.boolean().optional(),
  })
  .optional();

// Template IDs schema
const templateIdsSchema = z
  .object({
    leboncoin: z.string().nullable().optional(),
    whatsapp: z.string().nullable().optional(),
    sms: z.string().nullable().optional(),
    ringlessVoice: z.string().nullable().optional(),
  })
  .optional();

// Channel credit allocation schema
const channelCreditsSchema = z
  .object({
    sms: z
      .number()
      .int()
      .min(0, "Les crédits doivent être positifs")
      .optional(),
    whatsapp: z
      .number()
      .int()
      .min(0, "Les crédits doivent être positifs")
      .optional(),
    ringlessVoice: z
      .number()
      .int()
      .min(0, "Les crédits doivent être positifs")
      .optional(),
  })
  .optional();

// Main hunt form schema (client-side)
export const huntFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom est requis")
      .max(100, "Le nom ne peut pas dépasser 100 caractères"),
    searchUrl: z
      .string()
      .url("Veuillez entrer une URL valide")
      .refine(
        (url) => url.includes("leboncoin.fr"),
        "L'URL doit provenir de Leboncoin",
      )
      .optional(),
    autoRefresh: z.boolean(),
    dailyPacingLimit: z.number().int().min(1).max(1000).optional().nullable(),
    outreachSettings: outreachSettingsSchema,
    templateIds: templateIdsSchema,
    channelCredits: channelCreditsSchema,
  })
  .refine(
    (data) => {
      const settings = data.outreachSettings;
      if (!settings) return false;

      // At least one channel must be enabled (excluding leboncoin)
      return settings.whatsapp || settings.sms || settings.ringlessVoice;
    },
    {
      message: "Au moins un canal de communication doit être activé",
      path: ["outreachSettings"],
    },
  )
  .refine(
    (data) => {
      const settings = data.outreachSettings;
      const credits = data.channelCredits;
      if (!settings || !credits) return true;

      // If a channel is enabled, it must have credits > 0
      // WhatsApp is excluded - it has unlimited usage with 1000/day hard limit
      if (settings.sms && (!credits.sms || credits.sms <= 0)) {
        return false;
      }
      if (
        settings.ringlessVoice &&
        (!credits.ringlessVoice || credits.ringlessVoice <= 0)
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Les canaux activés doivent avoir des crédits alloués (> 0)",
      path: ["channelCredits"],
    },
  );

// Type inference for form data
export type THuntFormData = z.infer<typeof huntFormSchema>;

// Server action schema (includes all fields needed for database)
export const createHuntSchema = huntFormSchema
  .safeExtend({
    locationId: z.number().positive("L'emplacement est requis"),
    radiusInKm: z.number().min(0).default(0),
    adTypeId: z.number().positive("Le type d'annonce est requis"),
    dailyPacingLimit: z.number().int().min(1).max(1000).optional().nullable(),
    // Optional filter fields
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().positive().optional(),
    mileageMin: z.number().min(0).optional(),
    mileageMax: z.number().positive().optional(),
    modelYearMin: z.number().int().min(1900).optional(),
    modelYearMax: z
      .number()
      .int()
      .max(new Date().getFullYear() + 1)
      .optional(),
    // Boolean flags
    hasBeenReposted: z.boolean().optional(),
    priceHasDropped: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    hasBeenBoosted: z.boolean().optional(),
    isLowPrice: z.boolean().optional(),
    // Related filters
    brandIds: z.array(z.number()).optional(),
    subTypeIds: z.array(z.number()).optional(),
  })
  .refine(
    (data) => {
      const settings = data.outreachSettings;
      if (!settings) return false;

      // At least one channel must be enabled (excluding leboncoin)
      return settings.whatsapp || settings.sms || settings.ringlessVoice;
    },
    {
      message: "Au moins un canal de communication doit être activé",
      path: ["outreachSettings"],
    },
  )
  .refine(
    (data) => {
      const settings = data.outreachSettings;
      const credits = data.channelCredits;
      if (!settings || !credits) return true;

      // If a channel is enabled, it must have credits > 0
      // WhatsApp is excluded - it has unlimited usage with 1000/day hard limit
      if (settings.sms && (!credits.sms || credits.sms <= 0)) {
        return false;
      }
      if (
        settings.ringlessVoice &&
        (!credits.ringlessVoice || credits.ringlessVoice <= 0)
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Les canaux activés doivent avoir des crédits alloués (> 0)",
      path: ["channelCredits"],
    },
  );

export type TCreateHuntData = z.infer<typeof createHuntSchema>;

// Update hunt schema (all fields optional except what changes)
export const updateHuntSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional(),
  autoRefresh: z.boolean().optional(),
  dailyPacingLimit: z.number().int().min(1).max(1000).optional().nullable(),
  outreachSettings: outreachSettingsSchema,
  templateIds: templateIdsSchema,
  locationId: z.number().positive().optional(),
  radiusInKm: z.number().min(0).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().positive().optional(),
  mileageMin: z.number().min(0).optional(),
  mileageMax: z.number().positive().optional(),
  modelYearMin: z.number().int().min(1900).optional(),
  modelYearMax: z
    .number()
    .int()
    .max(new Date().getFullYear() + 1)
    .optional(),
  hasBeenReposted: z.boolean().optional(),
  priceHasDropped: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  hasBeenBoosted: z.boolean().optional(),
  isLowPrice: z.boolean().optional(),
});

export type TUpdateHuntData = z.infer<typeof updateHuntSchema>;
