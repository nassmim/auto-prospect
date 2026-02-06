# Task ID: 19

**Title:** Create Template Validation Schemas

**Status:** done

**Dependencies:** 16 ✓

**Priority:** high

**Description:** Create Zod validation schemas for text and voice template forms with channel-specific validation rules and French error messages.

**Details:**

Create `src/schemas/validation/template.validation.ts`:

```typescript
import { z } from 'zod';
import { messageChannels, type MessageChannel } from '@/schema/message-template.schema';

// Text template validation schema
export const textTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  channel: z.enum(['whatsapp', 'sms', 'leboncoin'] as const, {
    required_error: 'Le canal est requis',
    invalid_type_error: 'Canal invalide',
  }),
  content: z.string()
    .min(1, 'Le contenu du message est requis')
    .max(2000, 'Le contenu ne peut pas dépasser 2000 caractères'),
  isDefault: z.boolean().default(false),
});

export type TextTemplateFormData = z.infer<typeof textTemplateSchema>;

// Voice template validation schema
export const voiceTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  audioUrl: z.string()
    .url('URL audio invalide')
    .optional(),
  audioDuration: z.number()
    .min(15, 'La durée minimale est de 15 secondes')
    .max(55, 'La durée maximale est de 55 secondes'),
  isDefault: z.boolean().default(false),
});

export type VoiceTemplateFormData = z.infer<typeof voiceTemplateSchema>;

// Client-side voice template schema (before upload)
export const voiceTemplateClientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  audioBlob: z.instanceof(Blob, {
    message: 'Veuillez enregistrer ou importer un fichier audio',
  }),
  audioDuration: z.number()
    .min(15, 'La durée minimale est de 15 secondes')
    .max(55, 'La durée maximale est de 55 secondes'),
  isDefault: z.boolean().default(false),
});

export type VoiceTemplateClientData = z.infer<typeof voiceTemplateClientSchema>;
```

The voice template has two schemas:
1. Client schema validates the form before upload (uses Blob)
2. Server schema validates after upload (uses URL string)

**Test Strategy:**

1. Test text template schema rejects empty name and content
2. Test channel validation only accepts valid MessageChannel values
3. Test voice duration validation:
   - Reject duration < 15 seconds
   - Reject duration > 55 seconds
   - Accept duration between 15-55 seconds
4. Verify all error messages are in French
5. Test type inference for both schemas
