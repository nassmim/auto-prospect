/**
 * Centralized validation schemas for Auto-Prospect
 *
 * These schemas are used for both client-side (react-hook-form) and
 * server-side (server actions) validation to ensure consistent validation.
 *
 * @example Client-side usage in components
 * ```typescript
 * import { huntFormSchema, type THuntFormData } from '@/schemas/validation';
 *
 * const form = useForm<THuntFormData>({
 *   resolver: zodResolver(huntFormSchema),
 * });
 * ```
 *
 * @example Server-side usage in actions
 * ```typescript
 * import { createHuntSchema } from '@/schemas/validation';
 *
 * const result = createHuntSchema.safeParse(data);
 * if (!result.success) {
 *   throw new Error(formatZodError(result.error));
 * }
 * ```
 */

// Hunt schemas
export {
  createHuntSchema,
  huntFormSchema,
  updateHuntSchema,
  type TCreateHuntData,
  type THuntFormData,
  type TUpdateHuntData,
} from "./hunt.validation";

// Template schemas
export {
  textTemplateSchema,
  voiceTemplateClientSchema,
  voiceTemplateSchema,
  type TTextTemplateFormData,
  type TVoiceTemplateClientData,
  type TVoiceTemplateFormData,
} from "./template.validation";

// Lead schemas
export {
  leadNoteSchema,
  leadReminderFormSchema,
  leadReminderSchema,
  type TLeadNoteFormData,
  type TLeadReminderFormData,
} from "./lead.validation";

// Settings schemas
export {
  accountSettingsSchema,
  organizationNameSchema,
  saveSmsApiKeySchema,
  sendSmsSchema,
  teamInvitationSchema,
  type TAccountSettingsFormData,
  type TOrganizationNameFormData,
  type TSaveSmsApiKeySchema,
  type TSendSmsSchema,
  type TTeamInvitationFormData,
} from "./settings.validation";

export {
  sendWhatsAppTextMessageSchema,
  whatsappPhoneNumberSchema,
  type TSendWhatsAppTextMessageSchema,
  type TWhatsAppPhoneNumberSchema,
} from "./whatsapp.validation";

// Auth schemas
export {
  magicLinkSchema,
  type TMagicLinkFormData,
} from "./auth.validation";
