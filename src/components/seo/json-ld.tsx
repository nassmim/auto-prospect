/**
 * JSON-LD (JavaScript Object Notation for Linked Data) Component
 *
 * JSON-LD is a structured data format that helps search engines understand your content
 * by providing explicit semantics about your pages (accounts, products, articles, etc.).
 *
 * Benefits:
 * - Rich search results (enhanced snippets with images, ratings, prices)
 * - Knowledge Graph integration (your business info in Google's sidebar)
 * - Better content understanding by search engines
 *
 * Example output in HTML:
 * <script type="application/ld+json">
 * {
 *   "@context": "https://schema.org",
 *   "@type": "account",
 *   "name": "Auto-Prospect",
 *   "url": "https://auto-prospect.fr"
 * }
 * </script>
 */

import type {
  accountSchema,
  BreadcrumbSchema,
  ProductSchema,
  WebSiteSchema,
} from "@/lib/seo";
import Script from "next/script";

// Union type of all supported schema types
export type TJsonLdSchema =
  | accountSchema
  | WebSiteSchema
  | ProductSchema
  | BreadcrumbSchema;

export interface TJsonLdProps {
  // Accepts either a single schema or an array of schemas
  data: TJsonLdSchema | TJsonLdSchema[];
}

/**
 * Renders structured data as JSON-LD script tag in the page <head>
 *
 * Single schema usage:
 * <JsonLd data={generateaccountSchema()} />
 *
 * Multiple schemas usage (using @graph):
 * <JsonLd data={[accountSchema, breadcrumbSchema]} />
 */
export function JsonLd({ data }: TJsonLdProps) {
  // Build the JSON-LD object
  const jsonLd = {
    "@context": "https://schema.org", // Defines the vocabulary (schema.org)
    // If data is an array, wrap it in @graph to include multiple schemas
    // Otherwise, spread the single schema object directly
    ...(Array.isArray(data) ? { "@graph": data } : data),
  };

  return (
    <Script
      id="json-ld"
      type="application/ld+json" // Standard MIME type for JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
