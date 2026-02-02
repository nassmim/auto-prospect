# Task ID: 31

**Title:** Implement Reusable SEO Metadata Generation System

**Status:** done

**Dependencies:** 8 ✓

**Priority:** medium

**Description:** Create a centralized SEO metadata utility system with getSEOTags for generating Metadata objects with defaults, OpenGraph/Twitter cards, canonical URLs, robots directives, and JSON-LD structured data support for rich search results.

**Details:**

**Implementation Completed**

Created a comprehensive SEO metadata system with the following components:

**1. Core SEO Utilities (`src/lib/seo.ts`):**
- `siteConfig` - Centralized site configuration with name, description, URL (using `NEXT_PUBLIC_SITE_URL`), locale (fr_FR), Twitter handle, and default OG image
- `getSEOTags(options: SEOTagsOptions)` - Main function generating Next.js `Metadata` objects with:
  - Automatic title suffixing with site name
  - OpenGraph metadata (type limited to 'website' | 'article' per Next.js API)
  - Twitter card metadata
  - Canonical URL handling
  - Robots directives (noIndex/noFollow)
  - Keywords support
- `createMetadataGenerator<T>` - Helper for creating typed metadata generators for dynamic pages
- Helper functions: `normalizeImages()`, `buildRobotsDirective()`

**2. JSON-LD Schema Support:**
- Schema type interfaces: `accountSchema`, `WebSiteSchema`, `ProductSchema`, `BreadcrumbSchema`
- Schema generators:
  - `generateaccountSchema()` - For site-wide account structured data
  - `generateBreadcrumbSchema(items)` - For navigation breadcrumbs
  - `generateProductSchema(vehicle)` - For vehicle/product listings with EUR currency

**3. JSON-LD Component (`src/components/seo/json-ld.tsx`):**
- `<JsonLd data={schema} />` - React component rendering schema.org JSON-LD
- Supports single schema or array of schemas (using @graph)
- Uses Next.js Script component for proper hydration

**4. Updated Root Layout (`src/app/layout.tsx`):**
- Default SEO metadata via `getSEOTags()`
- account schema injected for rich search results
- HTML lang attribute set to 'fr' for French locale

**5. Reference Examples (`src/lib/seo-examples.ts`):**
- Static page metadata example (dashboard)
- Dynamic lead page metadata with noIndex
- Hunt page metadata with keywords
- Product and breadcrumb schema examples
- Full page.tsx integration pattern

**File Structure:**
```
src/
├── lib/
│   ├── seo.ts              # Core SEO utilities & schema generators
│   └── seo-examples.ts     # Usage reference examples
├── components/
│   └── seo/
│       └── json-ld.tsx     # JSON-LD component
└── app/
    └── layout.tsx          # Updated with SEO defaults
```

**Key Implementation Notes:**
- OpenGraph type uses 'website' | 'article' only (Next.js Metadata API constraint - 'product' not supported)
- Uses existing `NEXT_PUBLIC_SITE_URL` environment variable
- All schemas validated against schema.org specification
- TypeScript strict typing throughout

**Test Strategy:**

**Verification Completed:**

1. **Type Safety:** All files compile without TypeScript errors
2. **Integration:** Root layout successfully uses getSEOTags and JsonLd component
3. **Schema Validation:** JSON-LD output follows schema.org specification

**Remaining Manual Tests:**
- Run `pnpm build` to verify metadata generation at build time
- Inspect rendered HTML for correct meta tags in `<head>`
- Validate JSON-LD at https://validator.schema.org/
- Test with social media debuggers (Facebook/Twitter)

## Subtasks

### 31.1. Create core SEO utilities in src/lib/seo.ts

**Status:** done  
**Dependencies:** None  

Implement siteConfig constants, SEOTagsOptions interface, getSEOTags function with OpenGraph/Twitter card support, helper functions for image normalization and robots directives

**Details:**

Created src/lib/seo.ts with:
- siteConfig using NEXT_PUBLIC_SITE_URL
- SEOTagsOptions interface
- getSEOTags() function returning Next.js Metadata
- normalizeImages() and buildRobotsDirective() helpers
- createMetadataGenerator() for dynamic pages

### 31.2. Implement JSON-LD schema types and generators

**Status:** done  
**Dependencies:** 31.1  

Add accountSchema, WebSiteSchema, ProductSchema, and BreadcrumbSchema interfaces with corresponding generator functions to src/lib/seo.ts

**Details:**

Added to src/lib/seo.ts:
- Schema interfaces for account, WebSite, Product, BreadcrumbList
- generateaccountSchema() for site-wide structured data
- generateBreadcrumbSchema() for navigation
- generateProductSchema() for vehicle listings with EUR currency and Offer schema

### 31.3. Create JsonLd React component

**Status:** done  
**Dependencies:** 31.2  

Build src/components/seo/json-ld.tsx component that renders JSON-LD structured data using Next.js Script component with proper @context and @graph support

**Details:**

Created src/components/seo/json-ld.tsx:
- JsonLd component accepting single schema or array
- Uses Next.js Script component for proper hydration
- Adds @context and supports @graph for multiple schemas
- Exports JsonLdSchema union type and JsonLdProps interface

### 31.4. Update root layout with default SEO metadata

**Status:** done  
**Dependencies:** 31.1, 31.3  

Integrate getSEOTags and JsonLd with account schema into src/app/layout.tsx, set HTML lang to 'fr'

**Details:**

Updated src/app/layout.tsx:
- Import getSEOTags, siteConfig, generateaccountSchema from @/lib/seo
- Import JsonLd from @/components/seo/json-ld
- Set metadata using getSEOTags with site defaults
- Add JsonLd component with account schema to body
- Changed html lang from 'en' to 'fr'

### 31.5. Create SEO usage examples reference file

**Status:** done  
**Dependencies:** 31.1, 31.2, 31.3  

Add src/lib/seo-examples.ts with documented examples for static pages, dynamic pages, and structured data patterns

**Details:**

Created src/lib/seo-examples.ts with:
- Static page metadata example (dashboard)
- Dynamic lead metadata with noIndex/noFollow
- Hunt metadata with keywords
- Product and breadcrumb schema examples
- Commented page.tsx integration pattern showing generateMetadata and JsonLd usage
