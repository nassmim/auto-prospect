# Task ID: 18

**Title:** Create Hunt Validation Schema

**Status:** done

**Dependencies:** 16 ✓

**Priority:** high

**Description:** Create the Zod validation schema for hunt creation/edit forms in a new centralized validation schemas directory with French error messages.

**Details:**

Create directory `src/schemas/validation/` and add `hunt.validation.ts`:

```typescript
import { z } from 'zod';

// Outreach settings schema
const outreachSettingsSchema = z.object({
  leboncoin: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  sms: z.boolean().optional(),
}).optional();

// Template IDs schema
const templateIdsSchema = z.object({
  leboncoin: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  sms: z.string().nullable().optional(),
}).optional();

// Main hunt form schema
export const huntFormSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  searchUrl: z.string()
    .url('Veuillez entrer une URL valide')
    .refine(
      (url) => url.includes('leboncoin.fr'),
      'L\'URL doit provenir de Leboncoin'
    ).optional(),
  autoRefresh: z.boolean().default(true),
  outreachSettings: outreachSettingsSchema,
  templateIds: templateIdsSchema,
});

// Type inference for form data
export type HuntFormData = z.infer<typeof huntFormSchema>;

// Server action schema (includes all fields)
export const createHuntSchema = huntFormSchema.extend({
  locationId: z.number().positive('L\'emplacement est requis'),
  radiusInKm: z.number().min(0).default(0),
  adTypeId: z.number().positive('Le type d\'annonce est requis'),
});

export type CreateHuntData = z.infer<typeof createHuntSchema>;
```

Also create an index.ts barrel export file in the validation directory.

**Test Strategy:**

1. Verify schema file compiles without TypeScript errors
2. Test schema validation manually:
   ```typescript
   const result = huntFormSchema.safeParse({ name: '' });
   console.log(result.success); // false
   console.log(result.error?.errors[0].message); // 'Le nom est requis'
   ```
3. Verify type inference works: `HuntFormData` should have correct field types
4. Test URL validation rejects non-Leboncoin URLs
5. Test all French error messages display correctly
