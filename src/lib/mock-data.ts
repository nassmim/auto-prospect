/**
 * Mock data for testing pages without authentication
 * TODO: Remove this file when authentication is fully implemented
 */

import type { DashboardStats, HuntSummary } from "@/actions/dashboard.actions";

export const mockDashboardStats: DashboardStats = {
  newLeadsToday: 12,
  leadsContacted: 45,
  messagesSentByChannel: {
    whatsapp: 23,
    sms: 15,
    leboncoin: 7,
  },
};

export const mockHunts: HuntSummary[] = [
  {
    id: "1",
    name: "SUV Premium Paris",
    status: "active",
    platform: "leboncoin",
    leadCount: 34,
    contactedCount: 12,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: "2",
    name: "Berlines BMW/Mercedes Lyon",
    status: "active",
    platform: "whatsapp",
    leadCount: 28,
    contactedCount: 8,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
  },
  {
    id: "3",
    name: "Utilitaires Île-de-France",
    status: "active",
    platform: "sms",
    leadCount: 19,
    contactedCount: 5,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
  },
];

export const mockaccountHunts = [
  {
    id: "1",
    accountId: "org-1",
    createdById: "user-1",
    name: "SUV Premium Paris",
    locationId: 1, // integer
    radiusInKm: 50,
    adTypeId: 1, // smallint
    autoRefresh: true,
    outreachSettings: {
      leboncoin: true,
      whatsapp: false,
      sms: false,
    },
    templateIds: {
      leboncoin: "template-1",
    },
    status: "active" as const,
    priceMin: 20000,
    priceMax: 50000,
    mileageMin: 0,
    mileageMax: 100000,
    modelYearMin: 2018,
    modelYearMax: null,
    hasBeenReposted: false,
    priceHasDropped: false,
    isUrgent: false,
    hasBeenBoosted: false,
    isLowPrice: false,
    isActive: true,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    location: {
      id: 1,
      zipcode: "75001",
      name: "Paris",
      lat: 48.8566,
      lng: 2.3522,
    },
    brands: [
      {
        id: "brand-filter-1",
        brandId: 1,
        baseFilterId: "1",
        brand: {
          id: 1,
          name: "BMW",
          lbcValue: "bmw",
          lobstrValue: null,
        },
      },
      {
        id: "brand-filter-2",
        brandId: 2,
        baseFilterId: "1",
        brand: {
          id: 2,
          name: "Mercedes-Benz",
          lbcValue: "mercedes",
          lobstrValue: null,
        },
      },
    ],
    subTypes: [
      {
        id: "subtype-filter-1",
        subTypeId: 1,
        baseFilterId: "1",
        subType: {
          id: 1,
          adTypeId: 1,
          name: "SUV",
          lbcValue: "suv",
          lobstrValue: null,
        },
      },
    ],
  },
  {
    id: "2",
    accountId: "org-1",
    createdById: "user-1",
    name: "Berlines BMW/Mercedes Lyon",
    locationId: 2,
    radiusInKm: 30,
    adTypeId: 1,
    autoRefresh: true,
    outreachSettings: {
      leboncoin: false,
      whatsapp: true,
      sms: false,
    },
    templateIds: {
      whatsapp: "template-2",
    },
    status: "active" as const,
    priceMin: 15000,
    priceMax: 40000,
    mileageMin: 0,
    mileageMax: 80000,
    modelYearMin: 2016,
    modelYearMax: null,
    hasBeenReposted: false,
    priceHasDropped: true,
    isUrgent: false,
    hasBeenBoosted: false,
    isLowPrice: false,
    isActive: true,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 60),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    location: {
      id: 2,
      zipcode: "69001",
      name: "Lyon",
      lat: 45.764,
      lng: 4.8357,
    },
    brands: [
      {
        id: "brand-filter-3",
        brandId: 1,
        baseFilterId: "2",
        brand: {
          id: 1,
          name: "BMW",
          lbcValue: "bmw",
          lobstrValue: null,
        },
      },
      {
        id: "brand-filter-4",
        brandId: 2,
        baseFilterId: "2",
        brand: {
          id: 2,
          name: "Mercedes-Benz",
          lbcValue: "mercedes",
          lobstrValue: null,
        },
      },
    ],
    subTypes: [
      {
        id: "subtype-filter-2",
        subTypeId: 2,
        baseFilterId: "2",
        subType: {
          id: 2,
          adTypeId: 1,
          name: "Berline",
          lbcValue: "berline",
          lobstrValue: null,
        },
      },
    ],
  },
  {
    id: "3",
    accountId: "org-1",
    createdById: "user-1",
    name: "Utilitaires Île-de-France",
    locationId: 3,
    radiusInKm: 100,
    adTypeId: 2,
    autoRefresh: false,
    outreachSettings: {
      leboncoin: false,
      whatsapp: false,
      sms: true,
    },
    templateIds: {
      sms: "template-3",
    },
    status: "paused" as const,
    priceMin: 10000,
    priceMax: 30000,
    mileageMin: 0,
    mileageMax: 150000,
    modelYearMin: 2015,
    modelYearMax: null,
    hasBeenReposted: false,
    priceHasDropped: false,
    isUrgent: false,
    hasBeenBoosted: false,
    isLowPrice: true,
    isActive: false,
    lastScanAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    location: {
      id: 3,
      zipcode: "75000",
      name: "Île-de-France",
      lat: 48.8566,
      lng: 2.3522,
    },
    brands: [
      {
        id: "brand-filter-5",
        brandId: 3,
        baseFilterId: "3",
        brand: {
          id: 3,
          name: "Renault",
          lbcValue: "renault",
          lobstrValue: null,
        },
      },
      {
        id: "brand-filter-6",
        brandId: 4,
        baseFilterId: "3",
        brand: {
          id: 4,
          name: "Peugeot",
          lbcValue: "peugeot",
          lobstrValue: null,
        },
      },
    ],
    subTypes: [
      {
        id: "subtype-filter-3",
        subTypeId: 3,
        baseFilterId: "3",
        subType: {
          id: 3,
          adTypeId: 2,
          name: "Utilitaire",
          lbcValue: "utilitaire",
          lobstrValue: null,
        },
      },
    ],
  },
];
