/**
 * Centralized validation schemas for Auto-Prospect
 *
 * These schemas are used for both client-side (react-hook-form) and
 * server-side (server actions) validation to ensure consistent validation.
 *
 * @example Client-side usage in components
 * ```typescript
 * import { huntFormSchema, type HuntFormData } from '@/schemas/validation';
 *
 * const form = useForm<HuntFormData>({
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
  huntFormSchema,
  createHuntSchema,
  updateHuntSchema,
  type HuntFormData,
  type CreateHuntData,
  type UpdateHuntData,
} from "./hunt.validation";

// Template schemas
export {
  textTemplateSchema,
  voiceTemplateSchema,
  voiceTemplateClientSchema,
  type TextTemplateFormData,
  type VoiceTemplateFormData,
  type VoiceTemplateClientData,
} from "./template.validation";

// Lead schemas
export {
  leadNoteSchema,
  leadReminderSchema,
  type LeadNoteFormData,
  type LeadReminderFormData,
} from "./lead.validation";

// Settings schemas
export {
  teamInvitationSchema,
  organizationSettingsSchema,
  type TeamInvitationFormData,
  type OrganizationSettingsFormData,
} from "./settings.validation";
