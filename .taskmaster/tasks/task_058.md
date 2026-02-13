# Task ID: 58

**Title:** Redesign routes.ts with nested structure and dynamic route helpers

**Status:** done

**Dependencies:** 57 ✓

**Priority:** high

**Description:** Refactor `src/config/routes.ts` from a flat key-value structure to a nested object with logical grouping and add type-safe helper functions for dynamic routes (routes with parameters).

**Details:**

Refactor `src/config/routes.ts` from the current flat structure:
```typescript
export const pages = {
  login: "/login",
  hunts: "/hunts",
  hunts_new: "/hunts/new",
  // ...
} as const;
```

To a nested structure with dynamic route helpers:
```typescript
export const pages = {
  login: "/login",
  dashboard: "/dashboard",
  hunts: {
    list: "/hunts",
    new: "/hunts/new",
    create: "/hunts/create",
    detail: (huntId: string) => `/hunts/${huntId}` as const,
    edit: (huntId: string) => `/hunts/${huntId}/edit` as const,
  },
  leads: {
    list: "/leads",
    detail: (leadId: string) => `/leads/${leadId}` as const,
  },
  templates: {
    list: "/templates",
    new: "/templates/new",
  },
  pipeline: "/pipeline",
  settings: "/settings",
  credits: "/credits",
} as const;
```

Key design decisions:
- Static routes remain string literals for simplicity (e.g., `pages.settings`)
- Grouped routes use nested objects (e.g., `pages.hunts.list`, `pages.hunts.edit(id)`)
- Dynamic routes are functions returning template literal types for type safety
- Use `as const` to preserve literal types throughout
- Update `PageKey` and `PageValue` types to reflect the new structure, or remove them if they're no longer needed
- Keep backward compatibility temporarily by exporting old flat keys as aliases (to be removed after migration)

Consider adding a `StaticRoute` type that extracts all non-function route values for use in contexts that only accept strings (like `revalidatePath`).

**Test Strategy:**

1. Verify TypeScript compilation passes with no errors
2. Test that `pages.hunts.detail('abc')` returns `'/hunts/abc'`
3. Test that `pages.hunts.edit('abc')` returns `'/hunts/abc/edit'`
4. Test that `pages.leads.detail('xyz')` returns `'/leads/xyz'`
5. Verify all static routes resolve to correct string values
6. Run `pnpm build` to catch any type errors
