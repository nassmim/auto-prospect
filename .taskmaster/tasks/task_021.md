# Task ID: 21

**Title:** Refactor Hunt Form with react-hook-form and Zod

**Status:** done

**Dependencies:** 17 ✓, 18 ✓

**Priority:** high

**Description:** Refactor the HuntForm component to use react-hook-form with Zod validation, replacing useState-based form handling with proper form state management.

**Details:**

Refactor `src/components/hunts/hunt-form.tsx`:

1. Replace useState calls with useForm hook:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { huntFormSchema, type HuntFormData } from '@/schemas/validation/hunt.validation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const form = useForm<HuntFormData>({
  resolver: zodResolver(huntFormSchema),
  defaultValues: {
    name: hunt?.name ?? '',
    autoRefresh: hunt?.autoRefresh ?? true,
    outreachSettings: hunt?.outreachSettings ?? { leboncoin: false, whatsapp: false, sms: false },
    templateIds: hunt?.templateIds ?? { leboncoin: null, whatsapp: null, sms: null },
  },
});
```

2. Replace form JSX with shadcn Form components:
```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nom de la recherche</FormLabel>
          <FormControl>
            <Input placeholder="Ex: Peugeot 308 GTI Paris" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    {/* ... other fields */}
  </form>
</Form>
```

3. Update UrlPasteTab and SearchBuilderTab to work with form state (may need to use form.watch() and form.setValue())

4. Fix the TypeScript error in search-builder-tab props by ensuring proper typing

5. Update form submission to use validated data

**Test Strategy:**

1. Test form renders without errors
2. Test validation errors display in French when submitting empty form
3. Test name field shows error message for empty value
4. Test successful form submission with valid data
5. Test edit mode populates form with existing hunt data
6. Verify autoRefresh checkbox works correctly
7. Test form resets after successful submission
8. Verify URL paste tab still functions correctly
