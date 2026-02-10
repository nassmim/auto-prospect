# Task ID: 68

**Title:** Install SWR and Create SWR Provider

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Install the SWR dependency and create a global SWRConfig provider with sensible defaults for the application.

**Details:**

1. Run `pnpm add swr` to install SWR (~5KB gzipped).
2. `src/config/swr-keys.ts` already exists with all cache keys defined — no changes needed there.
3. Create `src/providers/swr-provider.tsx` as a client component wrapping `<SWRConfig>` with global defaults:
   - `dedupingInterval: 5000` (5s dedup to prevent rapid duplicate requests)
   - `revalidateOnFocus: true` (refresh when user returns to tab)
   - `revalidateOnReconnect: true` (refresh after network recovery)
   - `errorRetryCount: 3`
   - `shouldRetryOnError: true`
4. Wrap the app layout in `src/app/(app)/layout.tsx` with `<SWRProvider>` inside existing providers.
5. Ensure the provider is a client component (`'use client'`) but the layout remains a server component — pass `<SWRProvider>` as a wrapper around `{children}`.

**Test Strategy:**

Verify SWR is in package.json dependencies. Confirm the provider renders without errors by loading any app page. Check React DevTools for SWRConfig context. Verify no hydration mismatches in browser console.
