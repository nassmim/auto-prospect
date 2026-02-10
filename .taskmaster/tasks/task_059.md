# Task ID: 59

**Title:** Update sidebar and layout components to use new route structure

**Status:** done

**Dependencies:** 58 ✓

**Priority:** high

**Description:** Migrate the sidebar navigation config and app layout to use the new nested `pages` structure (e.g., `pages.hunts` → `pages.hunts.list`).

**Details:**

Files to update:

1. **`src/components/layout/sidebar.tsx`** (line 17-22):
   - Change `pages.hunts` → `pages.hunts.list`
   - Change `pages.templates` → `pages.templates.list`
   - Change `pages.leads` → `pages.leads.list` (if leads is added to sidebar)
   - `pages.dashboard`, `pages.pipeline`, `pages.settings`, `pages.credits` remain unchanged (flat keys)

2. **`src/app/(app)/layout.tsx`** (line 18, commented out):
   - Update commented redirect to use new structure if it references routes

3. **`src/components/layout/user-menu.tsx`** (line 13):
   - `pages.login` remains unchanged (flat key)

Pseudo-code for sidebar update:
```typescript
const navigation = [
  { name: "Dashboard", href: pages.dashboard, icon: HomeIcon },
  { name: "Hunts", href: pages.hunts.list, icon: MagnifyingGlassIcon },
  { name: "Pipeline", href: pages.pipeline, icon: Squares2X2Icon },
  { name: "Templates", href: pages.templates.list, icon: ChatBubbleBottomCenterTextIcon },
  { name: "Settings", href: pages.settings, icon: Cog6ToothIcon },
  { name: "Credits", href: pages.credits, icon: CurrencyDollarIcon },
];
```

**Test Strategy:**

1. Verify sidebar renders correctly with all navigation items
2. Click each sidebar link and verify correct page loads
3. Verify active state highlighting still works (pathname matching)
4. Run `pnpm build` to verify no type errors
