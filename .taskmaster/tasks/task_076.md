# Task ID: 76

**Title:** Parallelize Hunt Edit Page Data Fetching

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Replace sequential awaits in the hunt edit page with Promise.all() for faster page load.

**Details:**

File: `src/app/(app)/hunts/[id]/edit/page.tsx` (lines 30-35)

Current pattern (sequential):
```typescript
const hunt = await getHuntById(id);
const templates = await getAccountTemplates();
```

Migration:
```typescript
const [huntResult, templates] = await Promise.all([
  getHuntById(id).catch(() => null),
  getAccountTemplates(),
]);

if (!huntResult) {
  notFound();
}

const hunt = huntResult;
```

Key considerations:
- `getHuntById` may return null/throw for invalid IDs → handle with `.catch(() => null)` and `notFound()`
- `getAccountTemplates` should not fail due to hunt not found
- Both are independent queries that can run in parallel
- This is a pure server-side optimization — no SWR involved
- Measure timing with `console.time`/`console.timeEnd` during development to verify improvement

**Test Strategy:**

Measure page load time before and after change (use browser DevTools Performance tab or server-side timing). Verify both valid hunt ID and invalid hunt ID cases work correctly. Verify notFound() still renders 404 page for missing hunts. Verify templates still load correctly alongside hunt data.
