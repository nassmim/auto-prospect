# Task ID: 66

**Title:** Update CLAUDE.md with route configuration guidelines

**Status:** done

**Dependencies:** 65 ✓

**Priority:** medium

**Description:** Add documentation to CLAUDE.md about the centralized route configuration pattern, including usage examples and the convention that no hardcoded route strings should be introduced.

**Details:**

Add a new section to `CLAUDE.md` under the existing patterns/conventions:

```markdown
### Route Configuration
- **All routes MUST use `src/config/routes.ts`** — never hardcode route strings
- Import: `import { pages } from '@/config/routes'`
- Static routes: `pages.dashboard`, `pages.settings`, `pages.hunts.list`
- Dynamic routes: `pages.hunts.detail(huntId)`, `pages.leads.detail(leadId)`
- revalidatePath: `revalidatePath(pages.hunts.list)`, `revalidatePath(pages.leads.detail(id))`
- When adding a new page/route, add it to `routes.ts` first
- External URLs (e.g., Chrome Web Store, ad URLs) are exempt
```

Placement: Add under the '## Key Patterns' or '## Code Standards' section, near the existing architecture guidelines.

Keep it concise — just the essential rules and examples. Don't over-document.

**Test Strategy:**

1. Review the updated CLAUDE.md for accuracy and clarity
2. Verify the examples in the documentation match the actual routes.ts structure
3. Confirm the guidelines are consistent with the implementation
