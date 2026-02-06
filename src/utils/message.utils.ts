import { TTemplateVariables } from "@/services/message.service";

/**
 * Renders a message template by replacing variable placeholders
 * Variables use the format {variable_name}
 */
export function renderMessageTemplate(
  template: string,
  variables: TTemplateVariables,
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
