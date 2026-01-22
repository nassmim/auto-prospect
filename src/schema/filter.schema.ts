import { accounts } from "@/schema/account.schema";
import { adSubTypes, adTypes, brands, locations } from "@/schema/ad.schema";
import { organizations } from "@/schema/organization.schema";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  real,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

// Hunt status enum
export const huntStatuses = ["active", "paused"] as const;
export type HuntStatus = (typeof huntStatuses)[number];

// Outreach settings type for JSONB field
export type OutreachSettings = {
  leboncoin?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
};

// Template IDs type for JSONB field
export type TemplateIds = {
  leboncoin?: string | null;
  whatsapp?: string | null;
  sms?: string | null;
};

export const baseFilters = pgTable(
  "base_filters",
  {
    id: uuid().defaultRandom().primaryKey(),
    // Hunt metadata
    organizationId: uuid("organization_id").notNull(),
    createdById: uuid("created_by_id").notNull(), // Who created it (for audit trail)
    adTypeId: smallint("ad_type_id")
      .references(() => adTypes.id)
      .notNull(),
    // Search filter fields
    locationId: integer("location_id")
      .references(() => locations.id)
      .notNull(),
    radiusInKm: smallint().default(0).notNull(),
    name: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 20 }).notNull().default("active"),
    autoRefresh: boolean("auto_refresh").notNull().default(true),
    outreachSettings: jsonb("outreach_settings")
      .$type<OutreachSettings>()
      .default(sql`'{}'::jsonb`),
    templateIds: jsonb("template_ids")
      .$type<TemplateIds>()
      .default(sql`'{}'::jsonb`),
    lastScanAt: timestamp("last_scan_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    priceMin: real("price_min").default(0),
    mileageMin: real("mileage_min").default(0),
    mileageMax: real("mileage_max"),
    modelYearMin: real("model_year_min").default(2010),
    modelYearMax: real("model_year_max"),
    hasBeenReposted: boolean("has_been_reposted").default(false),
    priceHasDropped: boolean("price_has_dropped").default(false),
    isUrgent: boolean("is_urgent").default(false),
    hasBeenBoosted: boolean("has_been_boosted").default(false),
    isLowPrice: boolean("is_low_price").default(false),
    priceMax: real("price_max"),
    isActive: boolean("is_active").default(true),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "base_filters_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [accounts.id],
      name: "base_filters_created_by_id_fk",
    }).onDelete("cascade"),
    index("base_filters_organization_id_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("base_filters_organization_id_idx").on(table.organizationId),
    index("base_filters_created_by_id_idx").on(table.createdById),
    // RLS: Organization members can perform all operations on hunts in their org
    pgPolicy("enable all for organization members", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
      select 1 from organization_members om
      where om.organization_id = ${table.organizationId}
      and om.account_id = ${authUid}
      and om.joined_at is not null
    )`,
      withCheck: sql`exists (
      select 1 from organization_members om
      where om.organization_id = ${table.organizationId}
      and om.account_id = ${authUid}
      and om.joined_at is not null
    )`,
    }),
  ],
);

export const adSubTypesFilters = pgTable(
  "ad_sub_types_filter",
  {
    id: uuid().defaultRandom().primaryKey(),
    baseFilterId: uuid("base_filter_id").notNull(),
    subTypeId: smallint("sub_type_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.baseFilterId],
      foreignColumns: [baseFilters.id],
      name: "base_filters_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.subTypeId],
      foreignColumns: [adSubTypes.id],
      name: "ad_sub_types_id_fk",
    }).onDelete("no action"),
    pgPolicy("enable all crud for authenticated users", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const brandsFilters = pgTable(
  "brands_filter",
  {
    id: uuid().defaultRandom().primaryKey(),
    baseFilterId: uuid("base_filter_id").notNull(),
    brandId: smallint("brand_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.baseFilterId],
      foreignColumns: [baseFilters.id],
      name: "base_filters_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.brandId],
      foreignColumns: [brands.id],
      name: "brands_id_fk",
    }).onDelete("no action"),
    pgPolicy("enable all crud for authenticated users", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

// export const fuelsFilters = pgTable(
//   "fuels_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//     baseFilterId: uuid("base_filter_id").notNull(),
//     fuelId: smallint("fuel_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.baseFilterId],
//       foreignColumns: [baseFilters.id],
//       name: "base_filters_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.fuelId],
//       foreignColumns: [fuels.id],
//       name: "fuels_id_fk",
//     }).onDelete("no action"),
//     pgPolicy("enable all crud for authenticated users", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`true`,
//       withCheck: sql`true`,
//     }),
//   ],
// );

// export const drivingLicencesFilters = pgTable(
//   "driving_licences_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//     baseFilterId: uuid("base_filter_id").notNull(),
//     drivingLicenceId: smallint("driving_licence_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.baseFilterId],
//       foreignColumns: [baseFilters.id],
//       name: "base_filters_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.drivingLicenceId],
//       foreignColumns: [drivingLicences.id],
//       name: "driving_licences_id_fk",
//     }).onDelete("no action"),
//     pgPolicy("enable all crud for authenticated users", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`true`,
//       withCheck: sql`true`,
//     }),
//   ],
// );

// export const gearBoxesFilters = pgTable(
//   "gear_boxes_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//     baseFilterId: uuid("base_filter_id").notNull(),
//     gearBoxId: smallint("gear_box_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.baseFilterId],
//       foreignColumns: [baseFilters.id],
//       name: "base_filters_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.gearBoxId],
//       foreignColumns: [gearBoxes.id],
//       name: "gear_boxes_id_fk",
//     }).onDelete("no action"),
//     pgPolicy("enable all crud for authenticated users", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`true`,
//       withCheck: sql`true`,
//     }),
//   ],
// );

// export const vehicleSeatsFilters = pgTable(
//   "vehicle_seats_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//     baseFilterId: uuid("base_filter_id").notNull(),
//     vehicleSeatsId: smallint("vehicle_seats_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.baseFilterId],
//       foreignColumns: [baseFilters.id],
//       name: "base_filters_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.vehicleSeatsId],
//       foreignColumns: [vehicleSeats.id],
//       name: "vehicle_seats_id_fk",
//     }).onDelete("no action"),
//     pgPolicy("enable all crud for authenticated users", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`true`,
//       withCheck: sql`true`,
//     }),
//   ],
// );

// export const vehicleStatesFilters = pgTable(
//   "vehicle_states_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//     baseFilterId: uuid("base_filter_id").notNull(),
//     vehicleStateId: smallint("vehicle_state_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.baseFilterId],
//       foreignColumns: [baseFilters.id],
//       name: "base_filters_id_fk",
//     }).onDelete("cascade"),
//     foreignKey({
//       columns: [table.vehicleStateId],
//       foreignColumns: [vehicleStates.id],
//       name: "vehicle_states_id_fk",
//     }).onDelete("no action"),
//     pgPolicy("enable all crud for authenticated users", {
//       as: "permissive",
//       for: "all",
//       to: authenticatedRole,
//       using: sql`true`,
//       withCheck: sql`true`,
//     }),
//   ],
// );
// Relations
export const baseFiltersRelations = relations(baseFilters, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [baseFilters.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(accounts, {
    fields: [baseFilters.createdById],
    references: [accounts.id],
  }),
  location: one(locations, {
    fields: [baseFilters.locationId],
    references: [locations.id],
  }),
  type: one(adTypes, {
    fields: [baseFilters.adTypeId],
    references: [adTypes.id],
  }),
  subTypes: many(adSubTypesFilters),
  brands: many(brandsFilters),
}));

export const adSubTypesFiltersRelations = relations(
  adSubTypesFilters,
  ({ one }) => ({
    base: one(baseFilters, {
      fields: [adSubTypesFilters.baseFilterId],
      references: [baseFilters.id],
    }),
    subType: one(adSubTypes, {
      fields: [adSubTypesFilters.subTypeId],
      references: [adSubTypes.id],
    }),
  }),
);

export const brandsFiltersRelations = relations(brandsFilters, ({ one }) => ({
  base: one(baseFilters, {
    fields: [brandsFilters.baseFilterId],
    references: [baseFilters.id],
  }),
  brand: one(brands, {
    fields: [brandsFilters.brandId],
    references: [brands.id],
  }),
}));
