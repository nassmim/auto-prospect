# Task ID: 20

**Title:** Create Lead and Settings Validation Schemas

**Status:** done

**Dependencies:** 16 ✓

**Priority:** medium

**Description:** Create Zod validation schemas for lead notes, reminders, and settings page forms with appropriate validation rules.

**Details:**

Create `src/schemas/validation/lead.validation.ts`:

```typescript
import { z } from 'zod';

// Lead note validation
export const leadNoteSchema = z.object({
  content: z.string()
    .min(1, 'Le contenu de la note est requis')
    .max(5000, 'La note ne peut pas dépasser 5000 caractères'),
});

export type LeadNoteFormData = z.infer<typeof leadNoteSchema>;

// Lead reminder validation
export const leadReminderSchema = z.object({
  dueAt: z.coerce.date()
    .refine(
      (date) => date > new Date(),
      'La date doit être dans le futur'
    ),
  note: z.string()
    .max(1000, 'La note ne peut pas dépasser 1000 caractères')
    .optional(),
});

export type LeadReminderFormData = z.infer<typeof leadReminderSchema>;
```

Create `src/schemas/validation/settings.validation.ts`:

```typescript
import { z } from 'zod';

// Team invitation schema
export const teamInvitationSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .min(1, 'L\'email est requis'),
  role: z.enum(['admin', 'user'], {
    required_error: 'Le rôle est requis',
  }),
});

export type TeamInvitationFormData = z.infer<typeof teamInvitationSchema>;

// Organization settings schema (for future use)
export const organizationSettingsSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de l\'organisation est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

export type OrganizationSettingsFormData = z.infer<typeof organizationSettingsSchema>;
```

Update `src/schemas/validation/index.ts` to export all schemas.

**Test Strategy:**

1. Test note validation rejects empty content
2. Test reminder validation rejects past dates
3. Test email validation in team invitation schema
4. Verify z.coerce.date() properly handles datetime-local input strings
5. Test all error messages are in French
