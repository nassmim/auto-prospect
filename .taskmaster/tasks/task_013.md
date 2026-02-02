# Task ID: 13

**Title:** Build Settings Page with Connected Accounts and Team Management

**Status:** done

**Dependencies:** 1 ✓, 7 ✓

**Priority:** medium

**Description:** Implement settings interface with tabs for connected accounts (Leboncoin, WhatsApp QR, SMS API), filters, messages settings, and team/account management. Reference: 03-08 screenshots.

**Details:**

Create settings in `src/app/(app)/settings/page.tsx`:

1. **Tab Navigation:** Connected Accounts | Filters | Messages | Team

2. **Connected Accounts Tab:**
   - Leboncoin: Connection status badge, "Connecter" button (links to Chrome extension install - MVP: just info text)
   - WhatsApp: QR code placeholder (Phase 2 - show "Bientôt disponible" for direct integration)
   - SMS Mobile API: API key input field with mask, save button
   - Store API keys in account settings (encrypted if possible)

3. **Filters Tab:**
   - "Refus des professionnels" toggle with description
   - Examples list: "pas d'agence", "particulier seulement"
   - Save updates account settings

4. **Messages Tab:**
   - "Réinitialisation quotidienne" toggle - resets message counters at midnight
   - "Ignorer les annonces avec téléphone" toggle - skip auto-messaging for phone-visible listings
   - Save updates account settings

5. **Team Tab:**
   - account name input field (editable by owner)
   - "Autoriser la réassignation" toggle
   - "Restreindre la visibilité" toggle
   - Members list table: name, email, role badge, remove button (owner can't remove self)
   - Invite form: email input, role dropdown (Utilisateur/Admin), send button
   - Pending invitations list with resend/cancel actions

6. **Server Actions:**
   - `updateaccountSettings(settings)` - partial update
   - `inviteTeamMember(email, role)` - creates invitation, sends email (stub email for MVP)
   - `removeTeamMember(memberId)` - removes membership
   - `cancelInvitation(invitationId)` - deletes invitation

**Test Strategy:**

1. Change org name, verify persisted. 2. Toggle filter setting, verify saved. 3. Invite member, verify invitation created. 4. Remove member (non-owner), verify removed. 5. Try remove owner, verify blocked.
