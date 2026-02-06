import { TTemplateVariables } from "@/services/message.service";

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
}): TTemplateVariables {
  const {
    ad: { title, price, brand, model, modelYear, location, ownerName },
  } = lead;
  return {
    titre_annonce: title,
    prix: price ? `${price.toLocaleString("fr-FR")} €` : "",
    marque: brand?.name || "",
    modele: model || "",
    annee: modelYear?.toString() || "",
    ville: location.name,
    vendeur_nom: ownerName,
  };
}
