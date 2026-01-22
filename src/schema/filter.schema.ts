import { accounts } from "@/schema/account.schema";
import { adSubTypes, adTypes, brands, locations } from "@/schema/ad.schema";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  pgPolicy,
  pgTable,
  real,
  smallint,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const baseFilters = pgTable(
  "base_filters",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    adTypeId: smallint("ad_type_id")
      .references(() => adTypes.id)
      .notNull(),
    locationId: integer("location_id")
      .references(() => locations.id)
      .notNull(),
    radiusInKm: smallint().default(0).notNull(),
    priceMin: real("price_min").default(0).notNull(),
    mileageMin: real("mileage_min").default(0).notNull(),
    mileageMax: real("mileage_max"),
    modelYearMin: real("model_year_min").default(2010).notNull(),
    modelYearMax: real("model_year_max"),
    hasBeenReposted: boolean("has_been_reposted").default(false).notNull(),
    priceHasDropped: boolean("price_has_dropped").default(false).notNull(),
    isUrgent: boolean("is_urgent").default(false).notNull(),
    hasBeenBoosted: boolean("has_been_boosted").default(false).notNull(),
    isLowPrice: boolean("is_low_price").default(false).notNull(),
    priceMax: real("price_max"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  () => [
    pgPolicy("enable all crud for authenticated users", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
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
  account: one(accounts, {
    fields: [baseFilters.accountId],
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
