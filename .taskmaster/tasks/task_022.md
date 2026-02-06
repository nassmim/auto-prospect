# Task ID: 22

**Title:** Add Server-Side Validation to Hunt Actions

**Status:** done

**Dependencies:** 18 ✓

**Priority:** high

**Description:** Add Zod schema validation to createHunt and updateHunt server actions, ensuring the same validation rules apply on both client and server.

**Details:**

Update `src/actions/hunt-crud.actions.ts`:

1. Import and use the schema:
```typescript
import { createHuntSchema, type CreateHuntData } from '@/schemas/validation/hunt.validation';

export async function createHunt(data: unknown) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error('Non authentifié');
  }

  // Validate input with Zod
  const parseResult = createHuntSchema.safeParse(data);
  if (!parseResult.success) {
    const errors = parseResult.error.flatten();
    throw new Error(
      Object.values(errors.fieldErrors).flat()[0] || 'Données invalides'
    );
  }

  const validatedData = parseResult.data;
  // ... rest of the function using validatedData
}
```

2. Create a helper function for consistent error formatting:
```typescript
function formatZodError(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const firstError = Object.values(fieldErrors).flat()[0];
  return firstError || 'Données de formulaire invalides';
}
```

3. Apply same pattern to updateHunt action

4. Ensure error messages thrown are user-friendly French strings that can be displayed in the UI

**Test Strategy:**

1. Test createHunt with invalid data returns appropriate French error message
2. Test createHunt with missing required fields is rejected
3. Test createHunt with valid data succeeds
4. Test that bypassing client-side validation still gets caught by server
5. Test updateHunt validation similarly
6. Verify error messages are consistent between client and server
