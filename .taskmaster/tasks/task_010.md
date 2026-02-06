# Task ID: 10

**Title:** Build Lead Detail Drawer and Full Page Views

**Status:** done

**Dependencies:** 3 ✓, 5 ✓, 9 ✓

**Priority:** high

**Description:** Implement the lead detail drawer (quick access from pipeline) and full page view with complete vehicle specs, seller info, message history, and action buttons. Reference: 17-18-19-20 screenshots.

**Details:**

Create lead detail components:

1. **Lead Drawer (`src/components/leads/lead-drawer.tsx`):**
   - Slide-in panel from right (use Headless UI Dialog or custom)
   - Image gallery with thumbnails (ad.picture + parse pictures array)
   - Price, location, post date display
   - Stage selector dropdown (inline change)
   - Assigned user selector dropdown
   - Quick action buttons row:
     - WhatsApp: generate wa.me/{phone}?text={template} link, open in new tab
     - SMS: trigger send SMS modal (requires credits)
     - Voice: trigger send voice modal (requires credits)
     - Platform: link to open original listing URL
   - Reminders section: date picker + add reminder button
   - Notes section: textarea with save button, list existing notes
   - "Voir détails complets" button to open full page

2. **Full Page View (`src/app/(app)/leads/[id]/page.tsx`):**
   - All drawer content plus:
   - Complete vehicle specs grid: brand, model, year, mileage, fuel, gearbox, color, Crit'Air, seats, etc. (from ads table relations)
   - Seller info section: name, phone, type badge (private/pro based on acceptSalesmen)
   - Full listing description (ad.description)
   - Message history timeline (query messages for this lead)
   - Activity log timeline (query lead_activities)

3. **Data Fetching:**
   - Query lead with all ad relations (brand, fuel, gearbox, etc.)
   - Parallel queries for notes, reminders, messages, activities

4. **Server Actions:**
   - `addLeadNote(leadId, content)` - creates note, logs activity
   - `addLeadReminder(leadId, dueAt, note)` - creates reminder
   - `sendWhatsAppMessage(leadId, templateId)` - logs message attempt (MVP: just opens link)

**Test Strategy:**

1. Open drawer from Kanban, verify data loads correctly. 2. Change stage in drawer, verify pipeline updates. 3. Add note and reminder, verify persistence. 4. Click WhatsApp button, verify wa.me link opens with correct phone. 5. Navigate to full page, verify all specs displayed.

## Subtasks

### 10.1. Create Lead Drawer Component with Image Gallery and Basic Info

**Status:** done  
**Dependencies:** None  

Build the lead drawer slide-in panel component with image gallery, basic ad information display, and close functionality. This is the foundation for the quick-access lead details view.

**Details:**

Create `src/components/leads/lead-drawer.tsx` as a client component using Headless UI Dialog or custom implementation. Implement slide-in animation from right side with overlay backdrop. Build image gallery component that displays ad.picture as main image with thumbnails parsed from the pictures JSON array. Include navigation arrows for browsing images. Display basic ad information: price (formatted with currency), location (from zipcode relation), and post date (formatted relative time). Add close button (X icon) in top-right corner. Accept leadId as prop and fetch lead data with all ad relations (brand, model, fuel, gearbox, zipcode, etc.) using server action. Handle loading and error states gracefully.

### 10.2. Implement Stage and Assignment Selectors in Drawer

**Status:** done  
**Dependencies:** 10.1  

Add interactive stage selector dropdown and assigned user selector dropdown to the lead drawer, enabling inline updates to lead pipeline status and assignment.

**Details:**

Add stage selector dropdown component (use Headless UI Listbox) that displays current lead stage with colored badge. Include all 6 stages: Nouveau, Contacté, Relance, Négociation, Gagné, Perdu with appropriate colors matching the Kanban view. Create server action `updateLeadStage(leadId, newStage)` that updates the leads table, sets updatedAt, and logs activity in lead_activities. Add assigned user selector dropdown that shows current assignee (account name + avatar) or 'Non assigné' placeholder. Populate dropdown with all account members (query accounts by accountId). Create server action `updateLeadAssignment(leadId, assignedToId)` that updates assignedToId field and logs activity. Implement optimistic UI updates for both selectors to provide instant feedback. Add permission check - only account members can update assignments.

### 10.3. Build Quick Action Buttons Row for Communication Channels

**Status:** done  
**Dependencies:** 10.1  

Implement the quick action buttons for WhatsApp, SMS, Voice, and Platform link, enabling rapid outreach to sellers directly from the drawer.

**Details:**

Create action buttons row with 4 buttons: WhatsApp (green), SMS (blue), Voice (purple), Platform (gray). For WhatsApp button: import renderTemplate from whatsapp.services.ts, generate wa.me/{phone}?text={encodedMessage} link using lead's phone and account's default WhatsApp template, open link in new tab (_blank), log message attempt in messages table with type='whatsapp'. For SMS button: trigger SMS modal component (create modal shell, full implementation deferred), disable if account has no SMS credits, show tooltip 'Nécessite des crédits'. For Voice button: trigger voice modal component (create modal shell), disable if no credits, show tooltip. For Platform button: create direct link to ad.url (original listing), open in new tab with external link icon. Add loading states for each button during server actions. Include error handling with toast notifications for failed actions.

### 10.4. Add Notes and Reminders Sections to Drawer

**Status:** done  
**Dependencies:** 10.1  

Implement the notes and reminders functionality in the drawer, allowing users to add contextual information and schedule follow-ups for leads.

**Details:**

Create notes section with textarea input (placeholder: 'Ajouter une note...'), 'Sauvegarder' button, and list of existing notes sorted by createdAt DESC. Each note displays content, author name + avatar, and timestamp (relative format like '2 hours ago'). Implement server action `addLeadNote(leadId, content)` that inserts into lead_notes table with accountId, leadId, createdById (current user), content, and logs activity in lead_activities. Create reminders section with date-time picker component (use react-day-picker or similar), optional note textarea, and 'Ajouter' button. Display list of upcoming reminders sorted by dueAt ASC, each showing due date/time, note, and delete icon. Implement server action `addLeadReminder(leadId, dueAt, note)` that inserts into lead_reminders table and creates notification. Add validation: notes require non-empty content, reminders require future dueAt. Include optimistic UI updates for instant feedback.

### 10.5. Build Full Lead Detail Page with Complete Vehicle Specs and Timeline

**Status:** done  
**Dependencies:** 10.1, 10.2, 10.3, 10.4  

Create the comprehensive full-page lead detail view accessible from the drawer's 'Voir détails complets' button, displaying all vehicle specifications, seller information, message history, and activity timeline.

**Details:**

Create `src/app/(app)/leads/[id]/page.tsx` as server component that fetches lead with all relations (ad, brand, model, fuel, gearbox, bodyType, zipcodes, etc.) plus parallel queries for notes, reminders, messages, and activities. Build page layout with sections: (1) Hero section: reuse image gallery component, price, location, stage badge, assigned user, action buttons row from drawer. (2) Vehicle specs grid: display brand.name, model.name, year, mileage (formatted with km), fuel.name, gearbox.name, color, critAir, seats, doors, fiscalPower, din, registration, firstHand (boolean badge), from ad relations. Use responsive grid layout (2-3 columns). (3) Seller info card: display seller name (ad.account or derived), phone (clickable tel: link), type badge ('Particulier' if acceptSalesmen=false, 'Professionnel' if true). (4) Description section: render ad.description with preserved line breaks. (5) Message history timeline: query messages for this lead ordered by sentAt DESC, display each with type icon (WhatsApp/SMS/Voice), status badge (sent/delivered/failed), content preview, timestamp. (6) Activity log timeline: query lead_activities ordered by createdAt DESC, display each with action type, user who performed action, timestamp. Add 'Retour au pipeline' back button. Implement breadcrumb navigation: Leads > Lead #ID. Add metadata for SEO with ad title.
