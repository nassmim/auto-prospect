# Task ID: 11

**Title:** Build Hunt Creation and Edit Interface

**Status:** done

**Dependencies:** 2 ✓, 4 ✓, 7 ✓

**Priority:** medium

**Description:** Implement hunt creation/edit form with URL paste tab and search builder tab, plus outreach settings. Reference: 14-15-16 screenshots.

**Details:**

Create hunt forms in `src/app/(app)/hunts/`:

1. **Hunt List Page (`page.tsx`):**
   - Grid/list of all account hunts
   - Each card shows: name, status badge, stats (leads, contacted), platform, last scan
   - Actions: Edit, Pause/Resume toggle, Delete with confirmation
   - "Nouvelle Recherche" primary CTA button

2. **Hunt Create/Edit Page (`new/page.tsx` and `[id]/edit/page.tsx`):**
   - Name input field
   - Tabs for search definition:
     - **URL Paste Tab:** Text input for Leboncoin search URL, parse and validate URL format
     - **Search Builder Tab (Phase 2, stub for MVP):** Platform select, price range inputs, mileage range, brand multi-select, location + radius
   - Auto-refresh toggle
   
3. **Outreach Settings Section:**
   - Toggle switches for each channel: Leboncoin, WhatsApp, SMS
   - When toggle enabled, show template selector dropdown (query message_templates for org)
   - Hint text explaining what each channel does

4. **Form Handling:**
   - Use react-hook-form or Next.js Server Actions with useFormState
   - Validation: name required, URL or builder filters required
   - On submit: create/update hunt record, redirect to hunts list

5. **Components:**
   - `src/components/hunts/hunt-form.tsx` - main form component
   - `src/components/hunts/url-paste-tab.tsx`
   - `src/components/hunts/search-builder-tab.tsx` (placeholder for Phase 2)
   - `src/components/hunts/outreach-settings.tsx`

**Test Strategy:**

1. Create hunt with URL, verify saved correctly. 2. Edit hunt, change name and template, verify updates. 3. Toggle pause/resume, verify status changes. 4. Test validation - submit without name shows error. 5. Delete hunt with confirmation.
