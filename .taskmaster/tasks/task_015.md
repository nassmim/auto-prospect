# Task ID: 15

**Title:** Implement WhatsApp wa.me Link Messaging (MVP)

**Status:** done

**Dependencies:** 4 ✓, 5 ✓, 10 ✓

**Priority:** medium

**Description:** Implement MVP WhatsApp messaging by generating wa.me links with pre-filled template messages. When user clicks WhatsApp button on a lead, open the link with the phone number and rendered message template.

**Details:**

Create WhatsApp service in `src/services/whatsapp.services.ts`:

1. **Template Rendering Function:**
   ```typescript
   export function renderTemplate(template: string, lead: LeadWithAd): string {
     const variables = {
       '{titre_annonce}': lead.ad.title,
       '{ia_titre_annonce}': cleanTitle(lead.ad.title), // remove VENDS, À VENDRE, etc.
       '{ia_type_de_bien}': lead.ad.type?.name || 'Véhicule',
       '{lieu_annonce}': lead.ad.zipcode?.name || '',
       '{prix_annonce}': formatPrice(lead.ad.price),
     };
     
     return Object.entries(variables).reduce(
       (text, [key, value]) => text.replaceAll(key, value),
       template
     );
   }
   ```

2. **wa.me Link Generation:**
   ```typescript
   export function generateWhatsAppLink(phone: string, message: string): string {
     // Ensure phone is in international format without +
     const cleanPhone = phone.replace(/\D/g, '');
     const encodedMessage = encodeURIComponent(message);
     return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
   }
   ```

3. **Client Component Integration:**
   - In lead-drawer.tsx, WhatsApp button onClick:
     - Fetch default WhatsApp template for org (or show template picker)
     - Render template with lead data
     - Generate wa.me link
     - window.open(link, '_blank')
     - Log message attempt via Server Action

4. **Message Logging Server Action:**
   ```typescript
   'use server'
   export async function logWhatsAppAttempt(leadId: string, templateId: string, renderedContent: string) {
     const db = await createDrizzleSupabaseClient();
     await db.rls((tx) => tx.insert(messages).values({
       leadId,
       templateId,
       channel: 'whatsapp',
       content: renderedContent,
       status: 'sent', // MVP: assume sent since we opened the link
       sentAt: new Date(),
       sentById: getCurrentUserId(),
     }));
     // Also log activity
     await logLeadActivity(leadId, 'message_sent', { channel: 'whatsapp' });
   }
   ```

5. **UI Feedback:** Show toast "Message WhatsApp ouvert" after clicking

**Test Strategy:**

1. Click WhatsApp on lead with phone, verify link opens with correct phone and message. 2. Verify template variables replaced correctly. 3. Check message logged in database. 4. Test with lead missing phone - button should be disabled or show warning.
