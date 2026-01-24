# Task ID: 28

**Title:** Create Barrel Export and Documentation for Validation Schemas

**Status:** done

**Dependencies:** 18 ✓, 19 ✓, 20 ✓

**Priority:** low

**Description:** Create a proper barrel export file for all validation schemas and add inline documentation for schema usage patterns.

**Details:**

Create/update `src/schemas/validation/index.ts`:

```typescript
/**
 * Centralized validation schemas for Auto-Prospect
 * 
 * These schemas are used for both client-side (react-hook-form) and 
 * server-side (server actions) validation to ensure consistent validation.
 * 
 * Usage in components:
 * ```typescript
 * import { huntFormSchema, type HuntFormData } from '@/schemas/validation';
 * 
 * const form = useForm<HuntFormData>({
 *   resolver: zodResolver(huntFormSchema),
 * });
 * ```
 * 
 * Usage in server actions:
 * ```typescript
 * import { createHuntSchema } from '@/schemas/validation';
 * 
 * const result = createHuntSchema.safeParse(data);
 * if (!result.success) throw new Error(formatZodError(result.error));
 * ```
 */

// Hunt schemas
export {
  huntFormSchema,
  createHuntSchema,
  type HuntFormData,
  type CreateHuntData,
} from './hunt.validation';

// Template schemas
export {
  textTemplateSchema,
  voiceTemplateSchema,
  voiceTemplateClientSchema,
  type TextTemplateFormData,
  type VoiceTemplateFormData,
  type VoiceTemplateClientData,
} from './template.validation';

// Lead schemas
export {
  leadNoteSchema,
  leadReminderSchema,
  type LeadNoteFormData,
  type LeadReminderFormData,
} from './lead.validation';

// Settings schemas
export {
  teamInvitationSchema,
  organizationSettingsSchema,
  type TeamInvitationFormData,
  type OrganizationSettingsFormData,
} from './settings.validation';
```

Add a shared utility for formatting Zod errors:
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export function formatZodError(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const firstError = Object.values(fieldErrors).flat()[0];
  return firstError || 'Données de formulaire invalides';
}
```

**Test Strategy:**

1. Verify all exports are accessible from '@/schemas/validation'
2. Test importing individual schemas works
3. Test type imports work correctly
4. Verify formatZodError utility returns French error messages
5. Check no circular dependencies exist
