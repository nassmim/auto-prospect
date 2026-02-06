/**
 * SEO Usage Examples
 *
 * This file demonstrates how to use the SEO utilities in different scenarios.
 * These are reference examples - copy patterns into your actual page files.
 */

import { pages } from "@/config/routes";
import {
  generateBreadcrumbSchema,
  generateProductSchema,
  getSEOTags,
} from "@/lib/seo";
import type { Metadata } from "next";

// Example 1: Simple static page metadata
export const dashboardMetadata: Metadata = getSEOTags({
  title: "Tableau de bord",
  description: "Gérez vos campagnes de prospection et suivez vos résultats",
  canonical: pages.dashboard,
});

// Example 2: Dynamic page with lead details
export function generateLeadMetadata(lead: {
  ad: {
    title: string;
    description?: string;
    picture?: string;
    price?: number;
  };
  id: string;
}): Metadata {
  return getSEOTags({
    title: lead.ad.title,
    description: lead.ad.description?.slice(0, 160),
    canonical: pages.leads.detail(lead.id),
    openGraph: {
      images: lead.ad.picture ? [lead.ad.picture] : undefined,
    },
    noIndex: true, // Leads are private, don't index
    noFollow: true,
  });
}

// Example 3: Hunt page with custom keywords
export function generateHuntMetadata(hunt: {
  name: string;
  description?: string;
  id: string;
}): Metadata {
  return getSEOTags({
    title: hunt.name,
    description: hunt.description,
    keywords: ["prospection", "automobile", "hunt", "leboncoin"],
    canonical: pages.hunts.detail(hunt.id),
  });
}

// Example 4: Product schema for structured data
export const exampleProductSchema = generateProductSchema({
  title: "Renault Clio 2020",
  description: "Véhicule en excellent état avec faible kilométrage",
  price: 12500,
  image: "/images/vehicle.jpg",
});

// Example 5: Breadcrumb schema for navigation
export const exampleBreadcrumbSchema = generateBreadcrumbSchema([
  { name: "Accueil", url: "/" },
  { name: "Chasses", url: pages.hunts.list },
  { name: "Ma chasse", url: pages.hunts.detail("123") },
]);
