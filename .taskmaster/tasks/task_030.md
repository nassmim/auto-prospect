# Task ID: 30

**Title:** Refactor Page Components to Thin-Page Architecture

**Status:** done

**Dependencies:** 27 ✓, 29 ✓

**Priority:** medium

**Description:** Audit all page.tsx files in src/app/ and refactor them to follow the thin-page architecture pattern: keep only data fetching and component composition in page.tsx, moving all UI logic into dedicated view components.

**Details:**

## Overview

The project's CLAUDE.md specifies a thin-page architecture where `page.tsx` files should only handle data fetching, routing, and server-side concerns, while UI logic moves to separate view components. Currently, several pages violate this pattern by embedding extensive UI code directly.

## Pages Requiring Refactoring

### 1. Dashboard Page (HIGH PRIORITY - 184 lines)
**File:** `src/app/(app)/dashboard/page.tsx`
**Issues:** Contains extensive inline SVG icons, stat cards rendering, empty state UI
**Refactor to:**
```typescript
// page.tsx (thin)
export default async function DashboardPage() {
  const [stats, hunts] = await Promise.all([
    getDashboardStats(),
    getActiveHunts(),
  ]);
  return <DashboardView stats={stats} hunts={hunts} />;
}
```
**Create:** `src/components/dashboard/dashboard-view.tsx` - Move all JSX, header, stats grid, hunts section, empty state

### 2. Lead Detail Page (HIGH PRIORITY - 562 lines)
**File:** `src/app/(app)/leads/[id]/page.tsx`
**Issues:** Largest page file, contains constants (STAGE_LABELS, CHANNEL_ICONS), complex multi-column layout, message history, activity timeline
**Refactor to:**
```typescript
// page.tsx (thin)
export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [lead, messages, activities] = await Promise.all([
    getLeadDetails(id),
    getLeadMessages(id),
    getLeadActivities(id),
  ]);
  if (!lead) notFound();
  return <LeadDetailView lead={lead} messages={messages} activities={activities} />;
}
```
**Create:** `src/components/leads/lead-detail-view.tsx` - Move all UI including constants, breadcrumb, hero section, vehicle specs, message history, sidebar

### 3. Hunts Page (MEDIUM PRIORITY - 94 lines)
**File:** `src/app/(app)/hunts/page.tsx`
**Issues:** Contains header with inline SVG, empty state, grid layout
**Refactor to:**
```typescript
// page.tsx (thin)
export default async function HuntsPage() {
  const hunts = await getaccountHunts();
  return <HuntsView hunts={hunts} />;
}
```
**Create:** `src/components/hunts/hunts-view.tsx` - Move header, empty state, grid

### 4. Templates Page (MEDIUM PRIORITY - 110 lines)
**File:** `src/app/(app)/templates/page.tsx`
**Issues:** Contains header, section account, empty states for both text and voice templates
**Refactor to:**
```typescript
// page.tsx (thin)
export default async function TemplatesPage() {
  const templates = await getaccountTemplates();
  return <TemplatesView templates={templates} />;
}
```
**Create:** `src/components/templates/templates-view.tsx` - Move filtering logic, sections, empty states

### 5. New Hunt Page (LOW PRIORITY - 47 lines)
**File:** `src/app/(app)/hunts/new/page.tsx`
**Issues:** Contains breadcrumb navigation, header with description
**Refactor to:**
```typescript
// page.tsx (thin)
export default function NewHuntPage() {
  return <NewHuntView />;
}
```
**Create:** `src/components/hunts/new-hunt-view.tsx` - Move breadcrumb, header, HuntForm composition

### 6. New Template Page (LOW PRIORITY - 117 lines)
**File:** `src/app/(app)/templates/new/page.tsx`
**Issues:** Contains breadcrumb, type tabs with inline SVGs, conditional rendering
**Refactor to:**
```typescript
// page.tsx (thin)
export default async function NewTemplatePage({ searchParams }: PageProps) {
  const { type = "text" } = await searchParams;
  return <NewTemplateView type={type} />;
}
```
**Create:** `src/components/templates/new-template-view.tsx` - Move breadcrumb, tabs, form composition

## Implementation Guidelines

1. **View Component Naming:** Use `*-view.tsx` suffix (e.g., `hunts-view.tsx`, `dashboard-view.tsx`)
2. **Props Interface:** Define explicit TypeScript interfaces for view props
3. **Server vs Client:** View components can be Server Components unless they need interactivity (useState, event handlers)
4. **Data Types:** Import types from schema files or define prop types based on action return types
5. **Colocation:** Place view components in the same directory as related components (e.g., `src/components/dashboard/`)

## Files to Skip

- `src/app/page.tsx` - Root landing page, not part of app functionality
- `src/app/(app)/leads/page.tsx` - Already follows pattern with `LeadsPageClient`
- `src/app/(app)/settings/page.tsx` - Already follows pattern with `SettingsPageClient`

## Pattern Reference

**Good examples already in codebase:**
- `src/app/(app)/settings/page.tsx` → `settings-page-client.tsx`
- `src/app/(app)/leads/page.tsx` → `leads-page-client.tsx`

**Test Strategy:**

## Verification Steps

### 1. Visual Regression Testing
- Navigate to each refactored page and verify UI renders identically to before
- Check responsive layouts at mobile, tablet, and desktop breakpoints
- Verify all interactive elements (buttons, links) function correctly
- Confirm empty states display correctly when no data exists

### 2. Functionality Testing
For each refactored page:
- **Dashboard:** Verify stats cards show correct data, hunt list renders, "Create Hunt" links work
- **Hunts:** Verify hunt cards render, empty state shows when no hunts, "New Hunt" button works
- **Templates:** Verify text/voice sections render, empty states work, "New Template" links function
- **Lead Detail:** Verify all sections render (hero, specs, messages, activities), external links work
- **New Hunt/Template:** Verify forms submit correctly, breadcrumb navigation works

### 3. TypeScript Compilation
```bash
pnpm tsc --noEmit
```
- Ensure no type errors in new view components
- Verify prop interfaces match data structures from actions

### 4. Code Structure Verification
For each refactored page.tsx:
- [ ] Page file is under 30 lines
- [ ] Only contains: imports, data fetching, component composition
- [ ] No inline SVGs or complex JSX
- [ ] No UI state management (useState, useEffect)
- [ ] View component exists in appropriate components directory
- [ ] View component has proper TypeScript props interface

### 5. Development Server Testing
```bash
pnpm dev
```
- Visit each route and verify:
  - `/dashboard` - Stats and hunts render
  - `/hunts` - Hunt list or empty state
  - `/hunts/new` - Form renders correctly
  - `/templates` - Both sections render
  - `/templates/new` - Tabs and form work
  - `/leads/[id]` - Full detail page renders

### 6. Metadata Verification
- Verify `generateMetadata` functions still work for pages that have them
- Check page titles and descriptions in browser tab

## Subtasks

### 30.1. Integrate SEO tags for Dashboard page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to dashboard page using the reusable SEO utility

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add proper SEO tags (title, description, Open Graph, Twitter) to the dashboard page

### 30.2. Integrate SEO tags for Hunts page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to hunts page using the reusable SEO utility

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add proper SEO tags to the hunts list page

### 30.3. Integrate SEO tags for Templates page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to templates page using the reusable SEO utility

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add proper SEO tags to the templates page

### 30.4. Integrate SEO tags for Lead Detail page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to lead detail page using the reusable SEO utility with dynamic lead data

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add dynamic SEO tags based on lead information (vehicle details, status) for the lead detail page

### 30.5. Integrate SEO tags for New Hunt page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to new hunt page using the reusable SEO utility

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add proper SEO tags to the new hunt creation page

### 30.6. Integrate SEO tags for New Template page

**Status:** done  
**Dependencies:** None  

Add generateMetadata function to new template page using the reusable SEO utility

**Details:**

Import and use the generateSeoMetadata utility from src/lib/seo.ts to add proper SEO tags to the new template creation page
