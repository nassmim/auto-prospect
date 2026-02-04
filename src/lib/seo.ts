/**
 * SEO Metadata Generation System
 *
 * Provides reusable utilities for generating Next.js metadata (title, description, OG tags)
 * and structured data (JSON-LD schemas) to improve search engine visibility and social sharing.
 *
 * Key Features:
 * - Automatic defaults from siteConfig
 * - OpenGraph & Twitter Cards support
 * - Canonical URL management
 * - Robots directives (noIndex, noFollow)
 * - JSON-LD structured data generators
 */

import type { Metadata } from "next";

// Site-wide default configuration used as fallbacks for all metadata
export const siteConfig = {
  name: "Auto-Prospect",
  description:
    "Outil de prospection automatisée pour revendeurs professionnels",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://auto-prospect.fr",
  locale: "fr_FR", // French locale for OpenGraph
  twitterHandle: "@autoprospect",
  defaultImage: "/og-default.png", // Default OpenGraph image
} as const;

/**
 * Options for generating SEO metadata
 *
 * All fields except title are optional and will use siteConfig defaults
 *
 * NOTE: For SaaS applications, noIndex defaults to TRUE (most pages are private).
 * Explicitly set noIndex: false for public marketing pages that should be indexed.
 */
export interface SEOTagsOptions {
  title: string; // Page title (will be suffixed with site name)
  description?: string; // Meta description (max 160 chars recommended)
  keywords?: string[]; // Array of keywords (will be joined with commas)
  canonical?: string; // Canonical URL path (e.g., "/about")
  noIndex?: boolean; // Prevent search engine indexing (defaults to TRUE for SaaS apps)
  noFollow?: boolean; // Prevent search engines from following links
  openGraph?: {
    type?: "website" | "article"; // OpenGraph type (Next.js only supports these two)
    images?: string | string[]; // OG image URL(s) - accepts string or array
    siteName?: string; // Override default site name
    locale?: string; // Override default locale
  };
  twitter?: {
    card?: "summary" | "summary_large_image" | "app" | "player"; // Twitter card type
    creator?: string; // Twitter handle of content creator
    images?: string | string[]; // Twitter image(s) - falls back to OG images if not provided
  };
  extra?: Partial<Metadata>; // Additional metadata fields to merge
}

/**
 * Normalizes image input to array format for consistency
 * OpenGraph and Twitter support multiple images, so we convert single strings to arrays
 */
function normalizeImages(images?: string | string[]): string[] | undefined {
  if (!images) return undefined;
  return Array.isArray(images) ? images : [images];
}

/**
 * Builds robots meta tag object from boolean flags
 * Only returns an object if at least one restriction is active (optimization)
 */
function buildRobotsDirective(noIndex: boolean, noFollow: boolean) {
  // If no restrictions, don't include robots tag (search engines index by default)
  if (!noIndex && !noFollow) return undefined;
  return {
    index: !noIndex, // true means "allow indexing", false means "noindex"
    follow: !noFollow, // true means "follow links", false means "nofollow"
  };
}

/**
 * Generates complete Next.js Metadata object with SEO tags
 *
 * This is the main function you'll use in your pages. It combines all metadata
 * (title, description, OG tags, Twitter cards) into a single Metadata object.
 *
 * IMPORTANT: For SaaS apps, noIndex defaults to TRUE. For public marketing pages,
 * explicitly set noIndex: false to allow search engine indexing.
 *
 * Usage (private page - default):
 * export const metadata = getSEOTags({
 *   title: "Dashboard",
 *   description: "User dashboard",
 *   canonical: pages.dashboard,
 * }); // noIndex: true by default
 *
 * Usage (public page):
 * export const metadata = getSEOTags({
 *   title: "About Us",
 *   description: "Learn about our company",
 *   canonical: "/about",
 *   noIndex: false, // Explicitly allow indexing for public pages
 * });
 *
 * @param options - SEO configuration options
 * @returns Next.js Metadata object ready to export
 */
export function getSEOTags(options: SEOTagsOptions): Metadata {
  const {
    title,
    description = siteConfig.description, // Use site default if not provided
    keywords,
    canonical,
    noIndex = true, // Default to noIndex for SaaS (most pages are private/authenticated)
    noFollow = false,
    openGraph,
    twitter,
    extra, // Additional metadata fields to merge
  } = options;

  // Append site name to title for brand consistency (e.g., "Dashboard | Auto-Prospect")
  const fullTitle = `${title} | ${siteConfig.name}`;

  // Normalize images to array format for OpenGraph and Twitter
  const ogImages = normalizeImages(openGraph?.images);
  // Twitter images fall back to OpenGraph images if not explicitly provided
  const twitterImages = normalizeImages(twitter?.images) || ogImages;

  // Build robots directive only if needed
  const robotsDirective = buildRobotsDirective(noIndex, noFollow);

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(", "), // Convert array to comma-separated string
    metadataBase: new URL(siteConfig.url), // Base URL for relative paths in metadata
    alternates: canonical ? { canonical } : undefined, // Canonical URL to prevent duplicate content
    robots: robotsDirective,
    // OpenGraph tags for social media sharing (Facebook, LinkedIn, etc.)
    openGraph: {
      title: fullTitle,
      description,
      url: canonical || siteConfig.url, // Use canonical if provided, otherwise site URL
      siteName: openGraph?.siteName || siteConfig.name,
      locale: openGraph?.locale || siteConfig.locale,
      type: openGraph?.type || "website",
      images: ogImages,
    },
    // Twitter Card tags for Twitter/X sharing
    twitter: {
      card: twitter?.card || "summary_large_image", // Default to large image card
      title: fullTitle,
      description,
      creator: twitter?.creator || siteConfig.twitterHandle,
      images: twitterImages,
    },
    ...extra, // Spread any additional metadata fields
  };
}

/**
 * Higher-order function to create metadata generators for dynamic pages
 *
 * Useful when you have a repeating pattern for generating metadata from data.
 * Instead of calling getSEOTags directly, you can create a reusable generator.
 *
 * Example:
 * const generateLeadMetadata = createMetadataGenerator((lead: Lead) => ({
 *   title: lead.ad.title,
 *   description: lead.ad.description,
 *   noIndex: true,
 * }));
 *
 * // Then use it in your page
 * export const metadata = generateLeadMetadata(leadData);
 */
export type TMetadataGenerator<T> = (data: T) => SEOTagsOptions;

export function createMetadataGenerator<T>(
  generator: TMetadataGenerator<T>,
): (data: T) => Metadata {
  return (data: T) => getSEOTags(generator(data));
}

/**
 * JSON-LD Schema Type Definitions
 *
 * These interfaces define structured data schemas following schema.org vocabulary.
 * Use them with the JsonLd component to add rich snippets to your pages.
 *
 * Schema.org is a collaborative vocabulary that helps search engines understand
 * your content and display it as rich results (enhanced search listings).
 */

// account schema - identifies your business/website
export interface accountSchema {
  "@type": "account";
  name: string; // Business name
  url: string; // Business website URL
  logo?: string; // Logo URL (helps Google Knowledge Panel)
}

// WebSite schema - defines your website's search functionality
export interface WebSiteSchema {
  "@type": "WebSite";
  name: string; // Site name
  url: string; // Site URL
  potentialAction?: {
    "@type": "SearchAction";
    target: string; // Search URL template (e.g., "/search?q={search_term_string}")
    "query-input": string; // Required format: "required name=search_term_string"
  };
}

// Product schema - for items being sold (vehicles in your case)
export interface ProductSchema {
  "@type": "Product";
  name: string; // Product title
  description?: string; // Product description
  image?: string | string[]; // Product image(s)
  offers?: {
    "@type": "Offer";
    price: number; // Price in currency units
    priceCurrency: string; // ISO 4217 currency code (e.g., "EUR")
    availability?: string; // Schema.org availability URL (e.g., "https://schema.org/InStock")
  };
}

// Breadcrumb schema - shows navigation hierarchy in search results
export interface BreadcrumbSchema {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number; // 1-indexed position in breadcrumb trail
    name: string; // Displayed text
    item?: string; // URL for this breadcrumb item
  }>;
}

/**
 * Pre-built Schema Generators
 *
 * These functions generate common JSON-LD schemas using site config and provided data.
 * Use them with the JsonLd component to add structured data to your pages.
 */

/**
 * Generates account schema using site config
 * Use this in root layout to identify your business to search engines
 */
export function generateaccountSchema(): accountSchema {
  return {
    "@type": "account",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
  };
}

/**
 * Generates Breadcrumb schema from navigation items
 * Helps search engines understand site hierarchy and shows breadcrumbs in results
 *
 * Example:
 * generateBreadcrumbSchema([
 *   { name: "Accueil", url: "/" },
 *   { name: "Chasses", url: pages.hunts.list },
 *   { name: "Ma chasse" } // Last item typically has no URL
 * ])
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>,
): BreadcrumbSchema {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1, // Breadcrumbs are 1-indexed
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates Product schema for vehicles or items
 * Enables rich product snippets in search results (price, availability, image)
 *
 * Example:
 * generateProductSchema({
 *   title: "Renault Clio 2020",
 *   description: "Excellent état",
 *   price: 12500,
 *   image: "/images/vehicle.jpg"
 * })
 */
export function generateProductSchema(vehicle: {
  title: string;
  description?: string;
  price?: number;
  image?: string;
}): ProductSchema {
  return {
    "@type": "Product",
    name: vehicle.title,
    description: vehicle.description,
    image: vehicle.image,
    // Only include offers if price is provided
    offers: vehicle.price
      ? {
          "@type": "Offer",
          price: vehicle.price,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
}
