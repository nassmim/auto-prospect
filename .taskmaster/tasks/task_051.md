# Task ID: 51

**Title:** Replace Mock Data with Real Database Queries on Hunts Page

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** The hunts page (src/app/(app)/hunts/page.tsx) uses mockaccountHunts from mock-data.ts. Replace with real data fetching using the existing getAccountHunts() service.

**Details:**

The hunts page uses `mockaccountHunts` instead of querying the database:

1. **Service already exists**: `getAccountHunts()` in `src/services/hunt.service.ts` (line 198) fetches real hunts with all relations.

2. The commented-out import references `getaccountHunts` from `@/actions/hunt-crud.actions` which doesn't exist. The actual function is in `hunt.service.ts`.

3. **Decision**: Either:
   - Call the service directly from the Server Component page (Pattern 3: RLS Only), OR
   - Create a thin server action wrapper if needed for revalidation

4. Update `hunts/page.tsx`:
```typescript
import { getAccountHunts } from '@/services/hunt.service';
import { HuntsView } from '@/components/hunts/hunts-view';

export default async function HuntsPage() {
  const hunts = await getAccountHunts();
  return <HuntsView hunts={hunts} />;
}
```

5. Verify the return type of `getAccountHunts()` matches what `HuntsView` expects. The mock data structure includes `location`, `brands`, `subTypes` relations — confirm the service returns these.

6. Update the `HuntsView` type annotation (`src/components/hunts/hunts-view.tsx` line 7) to reference the correct service function instead of the non-existent `hunt.actions.getaccountHunts`.

7. Remove `mockaccountHunts` import from hunts/page.tsx.

**Test Strategy:**

Load the hunts page. Verify it displays real hunts from the database with correct data (name, location, brands, status). Test with zero hunts (empty state). Create a new hunt via /hunts/new and verify it appears in the list. Verify hunt status badges and credit info display correctly.
