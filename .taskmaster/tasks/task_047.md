# Task ID: 47

**Title:** Create Missing Credits Page

**Status:** done

**Dependencies:** 45 ✓

**Priority:** medium

**Description:** The sidebar references /credits but no page exists. Create a credits page that displays the account's credit balance, transaction history, and channel credit allocations using real data from the credits schema.

**Details:**

Create the credits page using existing schema and services:

1. **Schema exists**: `src/schema/credits.schema.ts` defines `creditTransactions` and `huntChannelCredits` tables.

2. **Service exists**: `src/services/credit.service.ts` has credit consumption logic.

3. Create the page structure:
   - `src/app/(app)/credits/page.tsx` — Server Component that fetches credit data
   - `src/components/credits/credits-view.tsx` — Client component for UI

4. **Page content**:
   - Current credit balance summary (total remaining credits)
   - Credit allocation per hunt/channel breakdown
   - Transaction history table (credit purchases, consumption)
   - Link to purchase more credits (placeholder if billing not implemented)

5. **Data fetching**: Create a service function `getAccountCredits()` in `credit.service.ts` if not already present. Use `dbClient.rls()` pattern for user-context queries.

6. Follow thin page.tsx pattern:
```typescript
// page.tsx
export default async function CreditsPage() {
  const creditData = await getAccountCredits();
  return <CreditsView data={creditData} />;
}
```

7. Use shadcn/ui components (Table, Card, Badge) for consistent styling.

**Test Strategy:**

Navigate to /credits from sidebar. Verify the page renders without errors. Check that credit data displays correctly from the database. Test with accounts that have credits and accounts with zero credits. Verify RLS policies work (user can only see their own credits).
