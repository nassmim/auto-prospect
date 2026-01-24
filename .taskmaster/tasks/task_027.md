# Task ID: 27

**Title:** Apply shadcn/ui Component Styling Consistency

**Status:** done

**Dependencies:** 21 ✓, 23 ✓, 25 ✓

**Priority:** medium

**Description:** Replace remaining custom form elements with shadcn/ui components across all refactored forms to ensure consistent styling and behavior.

**Details:**

Review and update all form components to use shadcn/ui consistently:

1. **Buttons**: Replace custom button styles with shadcn Button:
```typescript
import { Button } from '@/components/ui/button';

// Replace:
<button className="flex-1 rounded-lg bg-amber-500...">
// With:
<Button variant="default" className="flex-1">
```

May need to customize button variants in button.tsx to match amber theme.

2. **Input fields**: All text inputs should use shadcn Input
3. **Textareas**: Use shadcn Textarea component
4. **Checkboxes**: Use shadcn Checkbox with proper labeling:
```typescript
<FormField
  control={form.control}
  name="autoRefresh"
  render={({ field }) => (
    <FormItem className="flex items-center gap-3">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div>
        <FormLabel>Rafraîchissement automatique</FormLabel>
        <FormDescription>
          Recherche automatiquement de nouvelles annonces tous les jours
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

5. **Select dropdowns**: Use shadcn Select for channel selection and similar

6. **Error messages**: Ensure all use FormMessage for consistent error display

7. **Theme consistency**: Update shadcn components' CSS variables in globals.css to match the existing zinc/amber dark theme

**Test Strategy:**

1. Visual inspection of all forms for consistent styling
2. Test all interactive elements (buttons, checkboxes, selects) work correctly
3. Verify dark theme (zinc/amber) is maintained across all shadcn components
4. Test focus states and accessibility (keyboard navigation)
5. Verify error message styling is consistent
6. Test on different screen sizes for responsive behavior
