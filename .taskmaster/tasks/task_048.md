# Task ID: 48

**Title:** Create Missing Hunt Edit Page

**Status:** done

**Dependencies:** 45 ✓

**Priority:** high

**Description:** Multiple components link to /hunts/[id]/edit but no page exists. Create the hunt edit page reusing the existing hunt-form component with pre-populated data.

**Details:**

The hunt edit route is referenced in `hunt-card.tsx` and `hunt-list-item.tsx` but has no page:

1. Create `src/app/(app)/hunts/[id]/edit/page.tsx` as a Server Component:
```typescript
import { getHuntById } from '@/services/hunt.service';
import { notFound } from 'next/navigation';

export default async function EditHuntPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hunt = await getHuntById(id);
  if (!hunt) notFound();
  return <EditHuntView hunt={hunt} />;
}
```

2. **Service already exists**: `getHuntById(huntId)` in `src/services/hunt.service.ts` fetches a hunt with all relations (brands, subtypes, location).

3. **Action already exists**: `updateHunt(huntId, data)` in `src/actions/hunt.actions.ts` handles the update.

4. Create `src/components/hunts/edit-hunt-view.tsx` that reuses `HuntForm` component in edit mode. Pass existing hunt data as `defaultValues` to the form.

5. The existing `HuntForm` (`src/components/hunts/hunt-form.tsx`) likely needs a minor update to accept `initialData` prop and distinguish between create/edit modes.

6. After successful edit, redirect back to `/hunts` using `router.push(pages.hunts)`.

7. Handle the case where the hunt ID doesn't exist with Next.js `notFound()`.

**Test Strategy:**

Click the edit button on a hunt card. Verify the edit page loads with pre-populated hunt data. Modify a field and submit. Verify the update persists in the database. Test with invalid hunt IDs to verify 404 handling. Test form validation on edit.
