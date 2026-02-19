# PRD: Hunt Per-Channel Templates & Manual Message Buttons

## Overview

Two distinct problems to fix:

1. **Background hunt orchestrator** currently uses a global `isDefault` template per channel, shared across all hunts for the account. This is wrong — each hunt should use its own template per channel.

2. **Manual messaging** from a lead view currently does not expose clear, distinct send buttons. The user should see dedicated per-channel action buttons (WhatsApp, Ringless Voice) directly on the lead. One click = send immediately using the default template for that channel. No intermediate dialog, no template picker, no friction.

### What stays unchanged

- `isDefault` field remains in the schema, validation, actions, and template forms — it is correct and useful for manual messaging (auto-selects the right template when the user clicks a send button).
- The `isDefault` UI checkbox in template creation/edit forms stays.
- The "Défaut" badge on template cards stays.
- The `whatsapp.actions.ts` server action continues to look up the `isDefault` template for the channel automatically — no change needed there.

### What changes

- **Hunt orchestrator**: stop using `isDefault`. Each hunt specifies its own template per enabled channel.
- **Manual send UX**: expose two dedicated icon buttons per lead (WhatsApp, Ringless Voice). Clicking one fires the send action immediately — no intermediate step.

---

## Part 1: Associate Templates to Hunt Channels

### 1.1 Schema Investigation

Before writing schema, investigate the existing hunt schema (`packages/db/src/schema/`) to understand:
- Is there already a `huntChannels`, `huntChannelConfig`, or similar table?
- Where are enabled channels stored for a hunt?

Based on findings, pick the simplest model:

**If a per-channel config table already exists**: add a nullable `templateId` foreign key (`→ messageTemplates.id`, `on delete set null`) to that table.

**If no per-channel table exists**: create `huntChannelTemplates`:
- `id` — uuid, primary key
- `huntId` — uuid, FK → `hunts.id`, cascade delete
- `channel` — `EContactChannel` enum
- `templateId` — uuid, FK → `messageTemplates.id`, nullable, on delete set null
- Unique constraint on `(huntId, channel)`
- RLS: same policy as hunts (account owner only)

Generate Drizzle migration + custom migration for grants.

### 1.2 Hunt Creation/Edit UI

When a hunt is created or edited, for each enabled channel, show a template selector (a `<select>` or combobox) populated with the account's templates filtered by that channel.

- Template selector is optional (nullable) — if not set, that channel is skipped during the hunt run
- Selecting a template saves to `huntChannelTemplates` (upsert on `(huntId, channel)`)
- Show current selected template name if already set (for edit mode)

### 1.3 Worker: Daily Orchestrator

**File:** `apps/worker/src/workers/daily-orchestrator.ts`

- Remove the query for `isDefault: true` templates (lines ~329-340)
- Instead, fetch `huntChannelTemplates` for the current `huntId`, keyed by channel
- In the channel allocation loop, use the per-hunt template for each channel
- If no template is configured for a channel in this hunt, **skip that channel** and log a warning (do not fall back to `isDefault`)

---

## Part 2: Manual Send Buttons on Lead View

### 2.1 UX Requirement

On the lead detail view (and optionally on lead list cards), display two icon buttons:

- **WhatsApp button** — icon: WhatsApp logo or chat bubble. On click: calls the existing `sendWhatsAppTextMessage(leadId)` server action. This action already looks up `isDefault` template for the WhatsApp channel automatically. No change to the action.
- **Ringless Voice button** — icon: phone/voicemail. On click: calls the existing ringless voice send action. Same pattern — auto-selects default template.

Both buttons:
- Show a loading state while the action is in progress (disable button, show spinner)
- Show a success toast on completion
- Show an error toast if the action fails (e.g., no default template configured, no credentials)
- Are only shown/enabled if the lead has a phone number
- WhatsApp button only shown if account has WhatsApp configured
- Voice button only shown if account has voice credentials configured

### 2.2 No Dialog Required

There is no intermediate dialog, template picker, or custom message composer. The design principle is: **minimum friction**. The user sees the button, clicks it, the message is sent. If they want a different message or template, they go to `/templates` and set a different default.

### 2.3 Error Handling

If a channel has no `isDefault` template configured:
- The server action returns a specific error (e.g., `ErrorCode.NO_DEFAULT_TEMPLATE`)
- The UI shows a toast: "Aucun template par défaut configuré pour ce canal. Allez dans Modèles pour en définir un."

### 2.4 Where to Place Buttons

Investigate the existing lead detail/list views to find the right placement:
- Lead detail page: add buttons to the action bar or contact section
- Lead list card: optionally add small icon buttons on hover (consistent with existing card actions like delete)

---

## Implementation Order (for TaskMaster)

1. **Investigate hunt schema** — find existing channel config tables, determine model
2. **Schema + migration** — add `templateId` to existing table OR create `huntChannelTemplates`, generate Drizzle migration + grants
3. **Hunt creation/edit UI** — add per-channel template selector
4. **Update daily orchestrator** — fetch per-hunt templates, skip channels with no template
5. **Add manual send buttons to lead view** — WhatsApp + Voice icon buttons with loading/error states
6. **Error handling for missing default template** — new error code + user-facing toast
7. **End-to-end testing** — hunt runs with per-hunt template, manual send via each button

---

## Out of Scope

- Custom message composer (deliberately excluded — too much friction)
- Template picker dialog (deliberately excluded — same reason)
- SMS manual send button (add only if SMS is already wired up the same way as WhatsApp/Voice)
- Template editing from lead view

---

## Key Files Affected

| File | Change |
|------|--------|
| `packages/db/src/schema/` | Add templateId to hunt channel config (or new table) |
| `apps/worker/src/workers/daily-orchestrator.ts` | Use per-hunt templates, remove isDefault query |
| Hunt creation/edit components | Add per-channel template selector |
| Lead detail/list components | Add WhatsApp + Voice send icon buttons |
| `apps/web/src/actions/whatsapp.actions.ts` | No change to logic — keep isDefault lookup |
| Voice send action | No change to logic — keep isDefault lookup |
| `packages/shared/src/config/message.config.ts` | Add `NO_DEFAULT_TEMPLATE` error code if missing |
