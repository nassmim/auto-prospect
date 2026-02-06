# Task ID: 26

**Title:** Add Server-Side Validation to Lead Actions

**Status:** done

**Dependencies:** 20 ✓

**Priority:** medium

**Description:** Add Zod schema validation to addLeadNote and addLeadReminder server actions.

**Details:**

Update `src/actions/lead.actions.ts`:

1. Import schemas:
```typescript
import { leadNoteSchema, leadReminderSchema } from '@/schemas/validation/lead.validation';
```

2. Update addLeadNote:
```typescript
export async function addLeadNote(leadId: string, content: unknown) {
  // ... auth check

  // Validate content
  const parseResult = leadNoteSchema.safeParse({ content });
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const validatedContent = parseResult.data.content;
  // ... rest of function
}
```

3. Update addLeadReminder:
```typescript
export async function addLeadReminder(
  leadId: string,
  dueAt: unknown,
  note?: unknown,
) {
  // ... auth check

  // Validate reminder data
  const parseResult = leadReminderSchema.safeParse({ dueAt, note });
  if (!parseResult.success) {
    throw new Error(formatZodError(parseResult.error));
  }

  const { dueAt: validatedDueAt, note: validatedNote } = parseResult.data;
  // ... rest of function using validated values
}
```

4. Remove manual validation that's now handled by Zod:
```typescript
// Remove:
if (!content.trim()) {
  throw new Error('Note content cannot be empty');
}
// Zod handles this
```

**Test Strategy:**

1. Test addLeadNote rejects empty content with French error
2. Test addLeadReminder rejects past dates with French error
3. Test valid note content is accepted
4. Test valid future reminder date is accepted
5. Test optional reminder note field works correctly
6. Verify server catches validation bypass attempts
