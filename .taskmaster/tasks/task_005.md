# Task ID: 5

**Title:** Create Messages and Activity Log Schema

**Status:** done

**Dependencies:** 3 ✓, 4 ✓

**Priority:** medium

**Description:** Define schemas for tracking sent messages and lead activity history. This supports message history view and activity logging in lead detail.

**Details:**

Create `src/schema/message.schema.ts`:

1. **messages table:**
   - `id`: uuid, primary key, default random
   - `leadId`: uuid, FK to leads.id, on delete cascade
   - `templateId`: uuid, FK to message_templates.id, nullable
   - `channel`: varchar enum ('whatsapp', 'sms', 'voice', 'leboncoin')
   - `content`: text (rendered message with variables replaced)
   - `status`: varchar enum ('pending', 'sent', 'delivered', 'failed', 'read')
   - `externalId`: varchar nullable (provider message ID for tracking)
   - `sentAt`: timestamp nullable
   - `createdAt`: timestamp, default now
   - `sentById`: uuid, FK to accounts.id
   - Index on (leadId, createdAt) for message history queries
   - RLS: org members can CRUD

2. **lead_activities table:**
   - `id`: uuid, primary key, default random
   - `leadId`: uuid, FK to leads.id, on delete cascade
   - `type`: varchar enum ('stage_change', 'message_sent', 'assignment_change', 'note_added', 'reminder_set', 'created')
   - `metadata`: jsonb (type-specific data: { fromStage, toStage } or { channel, status })
   - `createdAt`: timestamp, default now
   - `createdById`: uuid, FK to accounts.id
   - Index on (leadId, createdAt) for timeline queries
   - RLS: org members can read

3. Create DB trigger function to auto-log activities on stage changes (optional, can be app-level)

**Test Strategy:**

1. Send message to lead, verify message record created with correct lead association. 2. Change lead stage, verify activity logged. 3. Query message history for lead, verify chronological ordering. 4. Test status transitions.
