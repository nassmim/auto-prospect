# Task ID: 7

**Title:** Build App Shell Layout with Dark Theme and Navigation

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Create the main application layout with sidebar navigation, dark theme styling, and responsive design following the Altoscan-inspired aesthetic. This provides the shell for all authenticated pages.

**Details:**

Create layout components in `src/app/(app)/layout.tsx`:

1. **App Layout Structure:**
   - Protected route group `(app)` with auth middleware check
   - Sidebar navigation (collapsible on mobile)
   - Main content area with max-width constraint
   - Top header with user menu, org switcher

2. **Sidebar Navigation Items:**
   - Dashboard (Home icon)
   - Hunts/Recherches (Search icon)
   - Leads/Pipeline (Kanban icon)
   - Templates (Message icon)
   - Settings (Cog icon)
   - Credits (Coins icon)

3. **Styling (Tailwind CSS 4):**
   - Dark theme as default (bg-zinc-950, text-zinc-100)
   - Amber accent color for CTAs (amber-500/600)
   - Card-based layout with subtle borders (border-zinc-800)
   - Geist font already configured in root layout
   - Consistent spacing (p-4, gap-4 patterns)

4. **Files to create:**
   - `src/app/(app)/layout.tsx` - Main layout
   - `src/components/layout/sidebar.tsx` - Navigation sidebar
   - `src/components/layout/header.tsx` - Top header
   - `src/components/layout/user-menu.tsx` - User dropdown
   - Update `globals.css` with dark theme CSS variables

5. **Auth Guard:** Check Supabase session in layout, redirect to /login if not authenticated

**Test Strategy:**

1. Verify dark theme renders correctly with Tailwind 4. 2. Test responsive behavior - sidebar collapses on mobile. 3. Verify auth redirect for unauthenticated users. 4. Navigate between all sections, verify active state styling.
