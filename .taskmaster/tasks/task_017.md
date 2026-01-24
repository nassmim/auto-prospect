# Task ID: 17

**Title:** Initialize shadcn/ui and Install Form Components

**Status:** done

**Dependencies:** 16 ✓

**Priority:** high

**Description:** Initialize shadcn/ui in the project and install the required form-related components: Form, Input, Textarea, Select, Checkbox, and Button.

**Details:**

Initialize shadcn/ui:
```bash
pnpm dlx shadcn@latest init
```

During init, configure for:
- TypeScript: Yes
- Style: Default (or match existing zinc/amber color scheme)
- Base color: Zinc (to match existing dark theme)
- CSS variables: Yes
- Tailwind CSS config: tailwind.config.ts (or app/globals.css for Tailwind v4)
- Components alias: @/components
- Utils alias: @/lib/utils

Then install required components:
```bash
pnpm dlx shadcn@latest add form input textarea select checkbox button label
```

The Form component from shadcn/ui is built on top of react-hook-form and provides:
- FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage
- Automatic error message display integration
- Accessible form controls with proper aria attributes

Note: The existing `src/components/ui/dropdown.tsx` should be kept as it may serve a different purpose than shadcn's Select.

**Test Strategy:**

1. Verify `components.json` is created at project root with correct configuration
2. Check `src/components/ui/` contains new shadcn components (form.tsx, input.tsx, etc.)
3. Verify `src/lib/utils.ts` is created with cn() helper function
4. Run `pnpm dev` and ensure no build/type errors
5. Import a component in any file to verify path aliases work:
   ```typescript
   import { Button } from '@/components/ui/button';
   ```
