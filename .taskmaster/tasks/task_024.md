# Task ID: 24

**Title:** Add Server-Side Validation to Template Actions

**Status:** done

**Dependencies:** 19 ✓

**Priority:** high

**Description:** Add Zod schema validation to createTextTemplate and createVoiceTemplate server actions for consistent validation.

**Details:**

Update `src/actions/template.actions.ts`:

1. Import schemas:
```typescript
import { textTemplateSchema, voiceTemplateSchema } from '@/schemas/validation/template.validation';
```

2. Update createTextTemplate:
```typescript
export async function createTextTemplate(data: unknown) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Non autorisé');
  }

  // Validate with Zod
  const parseResult = textTemplateSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedData = parseResult.data;
  // ... rest using validatedData.name, validatedData.channel, etc.
}
```

3. Update createVoiceTemplate similarly with voiceTemplateSchema

4. Remove redundant manual validation checks that are now handled by Zod:
```typescript
// Remove this:
if (!data.name.trim() || !data.content.trim()) {
  throw new Error('Name and content are required');
}
// Zod handles it now
```

5. Ensure error messages match the French messages from schemas

**Test Strategy:**

1. Test createTextTemplate rejects missing name/content with French errors
2. Test createTextTemplate rejects invalid channel values
3. Test createVoiceTemplate rejects invalid duration (<15s or >55s)
4. Test createVoiceTemplate rejects missing audioUrl
5. Test valid data passes validation and creates template
6. Verify server validation catches attempts to bypass client validation
