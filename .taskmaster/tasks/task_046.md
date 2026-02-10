# Task ID: 46

**Title:** Create Missing Pipeline Page (Redirect to Leads)

**Status:** done

**Dependencies:** 45 ✓

**Priority:** high

**Description:** The sidebar references /pipeline but no page exists. The leads page at /leads already implements the pipeline concept (Kanban + List views). Create a redirect from /pipeline to /leads to eliminate the 404.

**Details:**

The `/pipeline` route in the sidebar is conceptually the same as `/leads` (which already has a Kanban/List view with pipeline stages). Rather than duplicating the page:

1. Create `src/app/(app)/pipeline/page.tsx` that redirects to `/leads`:
```typescript
import { redirect } from 'next/navigation';
import { pages } from '@/config/routes';

export default function PipelinePage() {
  redirect(pages.leads);
}
```

2. **Alternative approach**: If the team prefers, update the sidebar to point directly to `/leads` instead of `/pipeline`, removing the `/pipeline` route entirely. This avoids a redirect hop.

3. Decide whether to keep both routes or consolidate. If consolidating, update `src/config/routes.ts` to remove the `pipeline` entry and update `sidebar.tsx` to use `pages.leads`.

4. Update SEO metadata if needed.

**Test Strategy:**

Click the Pipeline link in the sidebar. Verify it either redirects to /leads or directly navigates there. Verify the active state in the sidebar highlights correctly. Test on both desktop and mobile views.
