# Task ID: 12

**Title:** Build Message Templates Management Interface

**Status:** done

**Dependencies:** 4 ✓, 7 ✓

**Priority:** medium

**Description:** Implement templates list, creation form for text templates with variable insertion, and voice recording UI with duration validation. Reference: 09-12 screenshots.

**Details:**

Create templates interface in `src/app/(app)/templates/`:

1. **Templates List Page (`page.tsx`):**
   - Tabs or filter: Text | Voice (or show all with type badge)
   - Grid of template cards showing: name, type icon, channel badge, preview snippet
   - Edit/Delete actions per template
   - "Nouveau Template" CTA button

2. **Text Template Form (`new/page.tsx` with type param):**
   - Name input field
   - Channel select: WhatsApp | SMS | Leboncoin
   - Message content textarea
   - Variable insertion toolbar: buttons for each variable ({titre_annonce}, etc.)
   - Click variable button inserts at cursor position
   - "Suggérer par IA" button (stub for Phase 2 - just shows toast "Bientôt disponible")
   - Live preview panel showing rendered message with sample data

3. **Voice Template Form:**
   - Name input field
   - Recording UI:
     - Start/Stop recording button (use MediaRecorder API)
     - Duration timer display during recording
     - Validation: must be 15-55 seconds (show error if outside range)
   - OR file upload input for pre-recorded audio
   - Playback preview with audio player
   - On save: upload to Supabase Storage, store URL in template

4. **Components:**
   - `src/components/templates/text-template-form.tsx`
   - `src/components/templates/voice-template-form.tsx`
   - `src/components/templates/variable-toolbar.tsx`
   - `src/components/templates/audio-recorder.tsx` (Client Component)

5. **Server Actions:**
   - `createTemplate(data)` - handles text creation
   - `uploadVoiceTemplate(formData)` - uploads audio to Storage, creates template

**Test Strategy:**

1. Create text template with variables, verify stored. 2. Insert variable via toolbar, verify inserted at cursor. 3. Record voice <15s, verify error shown. 4. Record valid 30s voice, verify upload and save. 5. Play back saved voice template.
