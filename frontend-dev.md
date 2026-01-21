# AutoLead Pro - Product Requirements Document

## Reference Screenshots (Altoscan Competitor)

**Location:** `.taskmaster/docs/reference/`

| File | Shows |
|------|-------|
| `01-dashboard-stats-projects.png` | Dashboard: stats cards, project list, WhatsApp promo |
| `02-crm-kanban-view.png` | CRM Kanban: Nouveau/Contacté/Relance/Gagné stages |
| `03-settings-connected-accounts-whatsapp-qr.png` | Settings: Leboncoin + WhatsApp QR connection |
| `04-settings-connected-accounts-sms-api.png` | Settings: SMS Mobile API key config |
| `05-settings-filters-ai-professional-detection.png` | Settings: AI "Refus des professionnels" toggle |
| `06-settings-messages-scheduling-daily-reset.png` | Settings: Daily reset, ignore phone-visible listings |
| `07-settings-team-organization.png` | Settings: Organization name, permissions |
| `08-settings-team-invite-members.png` | Settings: Member list, invite form |
| `09-templates-add-text-whatsapp-variables.png` | Templates: WhatsApp with dynamic variables |
| `10-templates-add-voice-recording.png` | Templates: Voice record button |
| `11-templates-voice-recording-active.png` | Templates: Recording in progress |
| `12-templates-voice-duration-validation-15-55s.png` | Templates: 15-55 second validation |
| `13-credits-sms-voice-pricing-packs.png` | Credits: SMS packs €15-€400, Voice €40-€1250 |
| `14-project-edit-url-manual-tab.png` | Hunt edit: URL paste tab |
| `15-project-edit-search-builder-filters.png` | Hunt edit: Search builder with filters |
| `16-project-edit-messaging-options.png` | Hunt edit: Auto-message toggles |
| `17-lead-detail-drawer-actions-reminders.png` | Lead drawer: Actions, reminders |
| `18-lead-detail-drawer-notes.png` | Lead drawer: Notes editor |
| `19-lead-detail-fullpage-vehicle-specs.png` | Lead full page: Vehicle specs |
| `20-lead-detail-fullpage-seller-description.png` | Lead full page: Seller info |

---

## 1. Product Overview

**AutoLead Pro** is an automated prospection tool for car resellers. It scrapes vehicle listings from platforms like Leboncoin, manages leads in a CRM pipeline, and automates outreach via WhatsApp, SMS, and voice messages.

**Target User:** Independent car resellers (35-55 years old, low tech comfort, need simplicity)

**Core Value:** Save 15+ hours/week on manual lead generation

---

## 2. Features

### 2.1 Dashboard

**Requirements:**
- Display stats cards: new leads today, messages sent (by channel)
- List active hunts with: name, lead count, contacted count, last scan time
- Quick action: create new hunt
- Show trial/subscription status banner

### 2.2 Hunts (Search Projects)

A "Hunt" is a saved search that automatically scrapes listings.

**Hunt List Requirements:**
- Show all hunts with status (active/paused), stats, platform badge
- Actions: edit, pause/resume, delete

**Hunt Creation/Edit Requirements:**
- Name field
- Two tabs for defining search:
  - **URL Paste:** Paste a Leboncoin search URL directly
  - **Search Builder:** Build search with filters (platform, price range, mileage range, brands, location + radius)
- Outreach settings: toggle auto-message per channel (Leboncoin, WhatsApp, SMS)
- Template selection for auto-messages
- Toggle: auto-refresh daily

**Business Rules:**
- When a hunt is active, it should scrape new listings periodically
- New listings should be added as leads with stage "new"
- Duplicate detection: same listing from same platform should not create duplicate leads

### 2.3 Leads Pipeline

**Kanban View Requirements:**
- Columns: Nouveau (New), Contacté (Contacted), Relance (Follow-up), Négociation, Gagné (Won), Perdu (Lost)
- Lead cards show: thumbnail image, vehicle title, price, location, phone number if available
- Drag-and-drop between stages
- Platform badge (Leboncoin, etc.)
- Filter by: hunt, assigned user, date range
- Search by vehicle name/details

**List View Requirements:**
- Table with sortable columns: vehicle, price, location, stage, assigned, date
- Checkbox selection for bulk actions
- Toggle between Kanban and List views

### 2.4 Lead Detail

**Drawer View (quick access from pipeline):**
- Image gallery with thumbnails
- Price, location, post date
- Stage selector dropdown
- Assigned user selector
- Quick action buttons: WhatsApp, SMS, Voice, Platform message, Open original listing
- Reminders: date picker + add reminder
- Notes: text area to save notes
- Button to open full page view

**Full Page View:**
- All drawer content plus:
- Complete vehicle specs (brand, model, year, mileage, fuel, color, Crit'Air, etc.)
- Seller info (name, phone, type: private/professional)
- Full listing description
- Message history (all sent/received messages)
- Activity log (stage changes, messages sent, etc.)

### 2.5 Message Templates

**Text Templates (WhatsApp, SMS, Platform):**
- Name, channel type, message content
- Dynamic variables that get replaced:
  - `{titre_annonce}` - Original listing title
  - `{ia_titre_annonce}` - AI-cleaned title (removes "VENDS", etc.)
  - `{ia_type_de_bien}` - AI-detected type (Voiture, Moto, etc.)
  - `{lieu_annonce}` - City/location
  - `{prix_annonce}` - Price
- "Suggérer par IA" button to generate message with AI

**Voice Templates:**
- Name, audio file (upload or record)
- Recording: start/stop recording in browser
- Duration validation: must be between 15 and 55 seconds
- Playback preview before saving

### 2.6 Settings

**Connected Accounts Tab:**
- Leboncoin: connection status, "Connect Account" button (requires Chrome extension)
- WhatsApp: QR code to scan with WhatsApp/WhatsApp Business
- SMS Mobile API: API key input field with save button

**Filters Tab:**
- "Refus des professionnels" toggle: AI-powered detection to skip professional sellers
- Examples detected: "pas d'agence", "particulier seulement", "professionnels s'abstenir"

**Messages Tab:**
- "Réinitialisation quotidienne" toggle: reset message counters daily at midnight
- "Ignorer les annonces avec téléphone" toggle: skip auto-messaging for listings that already show phone number (contact directly instead)

**Team Tab:**
- Organization name field
- "Autoriser la réassignation des annonces" toggle
- "Restreindre la visibilité des annonces" toggle (users only see assigned leads)
- Members list showing name, email, role (Propriétaire/Utilisateur)
- Remove member button
- Invite section: email input, role dropdown, send invitation button

**Credits Tab:**
- Current balance display: SMS credits, Voice credits
- SMS credit packs: 100 (€15), 500 (€70), 1000 (€100), 5000 (€400)
- Voice credit packs: 100 (€40), 500 (€175), 1000 (€300), 5000 (€1250)
- Purchase button for each pack

### 2.7 Messaging

**WhatsApp:**
- MVP: Generate wa.me link with pre-filled message, open in new tab
- Future: Direct API integration

**SMS:**
- Integrate with SMS Mobile API
- Deduct credits on send
- Track delivery status

**Voice:**
- Integrate with voice message API
- Deduct credits on send
- Play selected voice template

**Platform (Leboncoin):**
- Send via Leboncoin's messaging system
- Requires Chrome extension + connected account

### 2.8 Background Jobs

- **Scraping job:** Periodically fetch new listings for active hunts
- **Auto-message job:** Send queued messages respecting rate limits
- **Daily reset job:** Reset message counters at midnight if enabled

---

## 3. Data Entities

Define these entities (follow existing project patterns for schema):

- **Organization:** Team/company, has settings, has many users
- **User:** Belongs to organization, has role (owner/admin/user)
- **Hunt:** Search project, has search config, outreach config, belongs to org
- **Lead:** Scraped listing, has listing/vehicle/seller data, stage, assigned user
- **Message:** Sent message, belongs to lead, has channel/status/content
- **Reminder:** Scheduled reminder for a lead
- **MessageTemplate:** Reusable message template (text or voice)
- **CreditBalance:** SMS and voice credits per organization
- **CreditTransaction:** Audit log for credit purchases and usage

---

## 4. Design Direction

- **Aesthetic:** Similar to Altoscan (see screenshots) - dark theme, card-based, clean
- **Differentiation:** Warmer accent colors (amber instead of teal), simpler onboarding
- **Key principles:** 
  - Mobile-friendly
  - Minimal clicks to common actions
  - Clear visual hierarchy
  - Non-technical language

---

## 5. MVP Phases

**Phase 1 (MVP):**
- Hunt creation (URL paste only)
- Leboncoin scraping
- Lead pipeline (Kanban + List)
- Lead detail (drawer)
- Manual messaging (WhatsApp wa.me links)
- Basic text templates
- Settings: Team basics

**Phase 2:**
- Search builder for hunts
- Auto-scraping (scheduled)
- Auto-messaging
- Voice templates
- SMS integration
- Reminders

**Phase 3:**
- AI filters (professional detection)
- Analytics dashboard
- Full message history
- Credits system with Stripe

**Phase 4:**
- Multi-platform (SeLoger, PAP)
- API for integrations
- White-label options

---

## 6. Success Metrics

- **North Star:** Leads contacted per week per user
- **Activation:** First hunt created within 24h of signup
- **Engagement:** Daily active users, messages sent per day
- **Retention:** Weekly active rate