# Task ID: 25

**Title:** Refactor Lead Drawer Forms with react-hook-form and Zod

**Status:** done

**Dependencies:** 17 ✓, 20 ✓

**Priority:** medium

**Description:** Refactor the notes and reminders forms in LeadDrawer component to use react-hook-form with Zod validation.

**Details:**

Update `src/components/leads/lead-drawer.tsx`:

1. Create separate form instances for notes and reminders:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  leadNoteSchema, 
  leadReminderSchema,
  type LeadNoteFormData,
  type LeadReminderFormData 
} from '@/schemas/validation/lead.validation';

// Notes form
const noteForm = useForm<LeadNoteFormData>({
  resolver: zodResolver(leadNoteSchema),
  defaultValues: { content: '' },
});

// Reminders form
const reminderForm = useForm<LeadReminderFormData>({
  resolver: zodResolver(leadReminderSchema),
  defaultValues: { dueAt: '', note: '' },
});
```

2. Replace notes form section:
```typescript
<Form {...noteForm}>
  <form onSubmit={noteForm.handleSubmit(handleAddNote)} className="space-y-2">
    <FormField
      control={noteForm.control}
      name="content"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              placeholder="Ajouter une note..."
              rows={3}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit" disabled={noteForm.formState.isSubmitting}>
      {noteForm.formState.isSubmitting ? 'Enregistrement...' : 'Sauvegarder'}
    </Button>
  </form>
</Form>
```

3. Replace reminders form similarly with datetime-local input

4. Reset forms after successful submission:
```typescript
const handleAddNote = async (data: LeadNoteFormData) => {
  try {
    await addLeadNote(lead.id, data.content);
    noteForm.reset();
    // ... reload lead
  } catch (err) {
    noteForm.setError('root', { message: err.message });
  }
};
```

5. Remove separate error state variables (noteError, reminderError) - use form state instead

**Test Strategy:**

1. Test note form validation rejects empty content
2. Test note form shows error message inline
3. Test reminder form validates future date requirement
4. Test reminder form accepts valid future date
5. Test forms reset after successful submission
6. Test submission loading states display correctly
7. Test error handling displays errors from server actions
