/**
 * JSON-LD (JavaScript Object Notation for Linked Data) Component
 *
 * JSON-LD is a structured data format that helps search engines understand your content
 * by providing explicit semantics about your pages (organizations, products, articles, etc.).
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
 *   "@type": "Organization",
 *   "name": "Auto-Prospect",
 *   "url": "https://auto-prospect.fr"
 * }
 * </script>
 */

import Script from "next/script";
import type {
  OrganizationSchema,
  WebSiteSchema,
  ProductSchema,
  BreadcrumbSchema,
} from "@/lib/seo";

// Union type of all supported schema types
export type JsonLdSchema =
  | OrganizationSchema
  | WebSiteSchema
  | ProductSchema
  | BreadcrumbSchema;

export interface JsonLdProps {
  // Accepts either a single schema or an array of schemas
  data: JsonLdSchema | JsonLdSchema[];
}

/**
 * Renders structured data as JSON-LD script tag in the page <head>
 *
 * Single schema usage:
 * <JsonLd data={generateOrganizationSchema()} />
 *
 * Multiple schemas usage (using @graph):
 * <JsonLd data={[organizationSchema, breadcrumbSchema]} />
 */
export function JsonLd({ data }: JsonLdProps) {
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
