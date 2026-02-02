# Centralize Route Constants PRD

## Overview
Eliminate all hardcoded route strings throughout the codebase and centralize them in a configuration file for better maintainability and type safety.

## Problem Statement

Currently, the application has hardcoded string literals scattered throughout the codebase for:
- Route paths (href, Link components)
- Redirects (redirect(), router.push())
- Revalidation paths (revalidatePath())
- API endpoints
- Other URL references

This creates several issues:
1. **Typo risk**: String literals can have typos that aren't caught until runtime
2. **Refactoring difficulty**: Changing a route requires finding all occurrences
3. **No type safety**: TypeScript can't validate route strings
4. **Inconsistency**: Same route might be written differently in different files
5. **Maintenance burden**: Hard to track which routes are used where

## Current State

The codebase already has `src/config/routes.ts` but it's not being used consistently:
- Some components use hardcoded strings like `'/login'`, `'/dashboard'`
- Redirects use string literals: `redirect('/hunts')`
- revalidatePath uses hardcoded paths: `revalidatePath('/hunts')`
- Links mix hardcoded strings with route config usage

## Requirements

### 1. Audit All Hardcoded Routes
- Search the entire codebase for hardcoded route strings
- Identify all locations using:
  - `href="/..."`
  - `redirect('/...')`
  - `router.push('/...')`
  - `revalidatePath('/...')`
  - Template literals with routes
  - Any other URL string literals

### 2. Extend Route Configuration
- Review existing `src/config/routes.ts`
- Add any missing routes to the configuration
- Ensure all routes follow a consistent naming pattern
- Create nested objects for logical grouping (e.g., `pages.hunts.list`, `pages.hunts.create`, `pages.hunts.edit`)
- Add type definitions for route parameters (e.g., hunt ID, lead ID)

### 3. Create Route Helper Functions
- Create helper functions for dynamic routes:
  - `pages.hunts.detail(huntId: string)` → `/hunts/${huntId}`
  - `pages.hunts.edit(huntId: string)` → `/hunts/${huntId}/edit`
  - `pages.leads.detail(leadId: string)` → `/leads/${leadId}`
- Ensure type safety with TypeScript
- Export all helpers from the routes config

### 4. Replace All Hardcoded Strings
- Systematically replace every hardcoded route string with config references
- Update imports to include routes config
- Verify no hardcoded route strings remain (use grep/search)
- Test all navigation, redirects, and revalidations work correctly

### 5. Update Project Guidelines
- Document the route configuration pattern in CLAUDE.md
- Add linting rules or documentation to prevent future hardcoded routes
- Create examples of correct usage

## Implementation Pattern

### Before:
```typescript
// Bad - hardcoded strings
redirect('/hunts')
router.push('/dashboard')
revalidatePath('/hunts')
<Link href="/settings">Settings</Link>
<Link href={`/hunts/${hunt.id}/edit`}>Edit</Link>
```

### After:
```typescript
// Good - centralized config
import { pages } from '@/config/routes'

redirect(pages.hunts.list)
router.push(pages.dashboard)
revalidatePath(pages.hunts.list)
<Link href={pages.settings}>Settings</Link>
<Link href={pages.hunts.edit(hunt.id)}>Edit</Link>
```

## Success Criteria

- Zero hardcoded route strings in the codebase (verified by search)
- All routes defined in centralized configuration
- Type-safe route helpers for dynamic routes
- All navigation, redirects, and revalidations work correctly
- Documentation updated with route configuration pattern
- Consistent naming convention across all routes

## Technical Notes

- Use `src/config/routes.ts` as the single source of truth
- Follow existing naming patterns in the routes config
- Ensure backward compatibility during migration
- Test thoroughly after replacing hardcoded strings
- Consider creating a custom ESLint rule to prevent future hardcoded routes

## Dependencies

- Should be done after Task 45 (navigation audit) to ensure all routes are discovered
- Should be done before or in parallel with page creation tasks (46-49)

## Priority

**HIGH** - This is a foundational improvement that affects code quality and maintainability across the entire application.
