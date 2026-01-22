/**
 * Message templating and rendering service
 * Handles variable replacement and message formatting
 */

type TemplateVariables = {
  titre_annonce?: string;
  prix?: string;
  marque?: string;
  modele?: string;
  annee?: string;
  ville?: string;
  vendeur_nom?: string;
};

/**
 * Renders a message template by replacing variable placeholders
 * Variables use the format {variable_name}
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    rendered = rendered.replace(new RegExp(placeholder, "g"), value || "");
  });

  return rendered;
}

/**
 * Generates a WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  // Remove non-digit characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Extracts template variables from lead data
 */
export function extractLeadVariables(lead: {
  ad: {
    title: string;
    price: number | null;
    model?: string | null;
    modelYear?: number | null;
    ownerName: string;
    brand?: { name: string } | null;
    location: { name: string };
  };
}): TemplateVariables {
  return {
    titre_annonce: lead.ad.title,
    prix: lead.ad.price ? `${lead.ad.price.toLocaleString("fr-FR")} €` : "",
    marque: lead.ad.brand?.name || "",
    modele: lead.ad.model || "",
    annee: lead.ad.modelYear?.toString() || "",
    ville: lead.ad.location.name,
    vendeur_nom: lead.ad.ownerName,
  };
}
