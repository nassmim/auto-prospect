# Form Validation and UI Component Refactoring

## Context
The current implementation lacks proper form validation and doesn't use shadcn/ui components consistently. All forms need to be refactored to use react-hook-form + Zod for both client and server-side validation.

## Requirements

### 1. Install Dependencies
- Install react-hook-form
- Install @hookform/resolvers for Zod integration
- Install zod (if not already installed)
- Verify shadcn/ui is properly configured

### 2. Create Validation Schemas
Create centralized Zod schemas in `src/schemas/validation/`:
- `hunt.validation.ts` - Hunt creation/edit form validation
- `template.validation.ts` - Template creation form validation (text & voice)
- `lead.validation.ts` - Lead update, notes, reminders validation
- `settings.validation.ts` - Settings page validation

Each schema should:
- Validate all required fields
- Include proper error messages in French
- Export TypeScript types derived from schemas
- Be reusable in both client and server

### 3. Refactor Hunt Forms
**Files to update:**
- `src/components/hunts/hunt-form.tsx`
- `src/actions/hunt-crud.actions.ts`

**Changes:**
- Replace useState with react-hook-form's useForm
- Add Zod resolver with huntFormSchema
- Implement proper error display for each field
- Add server-side validation in createHunt/updateHunt actions
- Fix TypeScript error in search-builder-tab props

### 4. Refactor Template Forms
**Files to update:**
- `src/components/templates/text-template-form.tsx`
- `src/components/templates/voice-template-form.tsx`
- `src/actions/template.actions.ts`

**Changes:**
- Replace useState with react-hook-form
- Add Zod validation for:
  - Text templates: name, channel, content required
  - Voice templates: name, audio file/recording, duration (15-55s)
- Add server-side validation in createTextTemplate/createVoiceTemplate
- Display validation errors inline

### 5. Refactor Lead Forms
**Files to update:**
- `src/components/leads/lead-drawer.tsx`
- `src/actions/lead.actions.ts`

**Changes:**
- Notes form: validate non-empty content
- Reminders form: validate future date, optional note
- Add server-side validation in addLeadNote/addLeadReminder

### 6. Integrate shadcn/ui Components
Replace custom components with shadcn equivalents where applicable:
- Form fields → shadcn Form component
- Buttons → shadcn Button component
- Select dropdowns → shadcn Select component
- Checkboxes → shadcn Checkbox component
- Textarea → shadcn Textarea component
- Input fields → shadcn Input component
- Error messages → shadcn Form field errors

**Priority files:**
- Hunt form components
- Template form components
- Lead drawer forms
- Settings page

### 7. Testing Validation
For each refactored form:
- Test client-side validation (required fields, format validation)
- Test server-side validation (attempt to bypass client validation)
- Verify error messages display correctly
- Ensure French error messages are clear and helpful
- Test happy path (valid submissions work)

## Success Criteria
- All forms use react-hook-form + Zod
- Client and server validation use same schemas
- No form can be submitted with invalid data
- All validation errors display in French
- shadcn/ui components used consistently
- TypeScript errors resolved
- Forms maintain existing functionality

## Phase Approach
**Phase 1 (High Priority):**
- Hunt creation form
- Template creation forms

**Phase 2 (Medium Priority):**
- Lead drawer forms
- Settings page

**Phase 3 (Low Priority):**
- Any remaining forms
- Polish and consistency pass
