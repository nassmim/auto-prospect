# Task ID: 4

**Title:** Create Message Templates Schema

**Status:** done

**Dependencies:** 1 ✓

**Priority:** medium

**Description:** Define schemas for text and voice message templates with support for dynamic variables. Templates are account-scoped and can be used for WhatsApp, SMS, and platform messaging.

**Details:**

Create `src/schema/message-template.schema.ts`:

1. **message_templates table:**
   - `id`: uuid, primary key, default random
   - `accountId`: uuid, FK to accounts.id
   - `name`: varchar(255), required
   - `type`: varchar enum ('text', 'voice')
   - `channel`: varchar enum ('whatsapp', 'sms', 'leboncoin') nullable (null for voice)
   - `content`: text (for text templates, with variable placeholders like {titre_annonce})
   - `audioUrl`: text nullable (Supabase Storage URL for voice)
   - `audioDuration`: integer nullable (in seconds, validated 15-55)
   - `isDefault`: boolean, default false
   - `createdAt`: timestamp, default now
   - `updatedAt`: timestamp, default now
   - `createdById`: uuid, FK to accounts.id
   - RLS: org members can CRUD

2. **template_variables table (static reference):**
   - `id`: smallserial, primary key
   - `key`: varchar(50) unique (e.g., 'titre_annonce', 'ia_titre_annonce')
   - `label`: varchar(100) (display name in French)
   - `description`: text
   - Public read access

3. Seed template_variables with values from PRD:
   - {titre_annonce} -> Original listing title
   - {ia_titre_annonce} -> AI-cleaned title
   - {ia_type_de_bien} -> AI-detected type
   - {lieu_annonce} -> City/location
   - {prix_annonce} -> Price

**Test Strategy:**

1. Create text template with variables, verify storage. 2. Test voice template duration validation (reject <15s or >55s). 3. Verify variable substitution logic works with sample lead data. 4. Test org isolation.
