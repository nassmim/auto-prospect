import { accounts } from "@/schema/account.schema";
import {
  adSubTypes,
  adTypes,
  brands,
  fuels,
  zipcodes
} from "@/schema/ad.schema";
import { relations, sql } from "drizzle-orm";
import { boolean, foreignKey, pgPolicy, pgTable, real, smallint, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const baseFilters = pgTable('base_filters', {
  id: uuid().defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  zipcodeId: uuid("zipcode_id").references(() => zipcodes.id).notNull(),
  latCenter: smallint("lat_center"),
  lngCenter: smallint("lng_center"),
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
() => [
  pgPolicy("enable all crud for authenticated users", {
    as: "permissive",
    for: "all",
    to: authenticatedRole,
    using: sql`true`,
    withCheck: sql`true`,
  }),
]
)

export const adTypesFilters = pgTable(
  "ad_types_filter",
  {
    id: uuid().defaultRandom().primaryKey(),
    baseFilterId: uuid("base_filter_id").notNull(),
    adTypeId: smallint("ad_type_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.baseFilterId],
      foreignColumns: [baseFilters.id],
      name: "base_filters_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.adTypeId],
      foreignColumns: [adTypes.id],
      name: "ad_types_id_fk",
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

export const adSubTypesFilters = pgTable(
  "ad_sub_types_filter",
  {
    id: uuid().defaultRandom().primaryKey(),
    baseFilterId: uuid("base_filter_id").notNull(),
    adSubTypeId: smallint("ad_sub_type_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.baseFilterId],
      foreignColumns: [baseFilters.id],
      name: "base_filters_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.adSubTypeId],
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

export const fuelsFilters = pgTable(
  "fuels_filter",
  {
    id: uuid().defaultRandom().primaryKey(),
    baseFilterId: uuid("base_filter_id").notNull(),
    fuelId: smallint("fuel_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.baseFilterId],
      foreignColumns: [baseFilters.id],
      name: "base_filters_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.fuelId],
      foreignColumns: [fuels.id],
      name: "fuels_id_fk",
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
  zipcode: one(zipcodes, {
    fields: [baseFilters.zipcodeId],
    references: [zipcodes.id],
  }),
  adTypesFilters: many(adTypesFilters),
  adSubTypesFilters: many(adSubTypesFilters),
  brandsFilters: many(brandsFilters),
  fuelsFilters: many(fuelsFilters),
}));

export const adTypesFiltersRelations = relations(adTypesFilters, ({ one }) => ({
  baseFilter: one(baseFilters, {
    fields: [adTypesFilters.baseFilterId],
    references: [baseFilters.id],
  }),
  adType: one(adTypes, {
    fields: [adTypesFilters.adTypeId],
    references: [adTypes.id],
  }),
}));

export const adSubTypesFiltersRelations = relations(adSubTypesFilters, ({ one }) => ({
  baseFilter: one(baseFilters, {
    fields: [adSubTypesFilters.baseFilterId],
    references: [baseFilters.id],
  }),
  adSubType: one(adSubTypes, {
    fields: [adSubTypesFilters.adSubTypeId],
    references: [adSubTypes.id],
  }),
}));

export const brandsFiltersRelations = relations(brandsFilters, ({ one }) => ({
  baseFilter: one(baseFilters, {
    fields: [brandsFilters.baseFilterId],
    references: [baseFilters.id],
  }),
  brand: one(brands, {
    fields: [brandsFilters.brandId],
    references: [brands.id],
  }),
}));

export const fuelsFiltersRelations = relations(fuelsFilters, ({ one }) => ({
  baseFilter: one(baseFilters, {
    fields: [fuelsFilters.baseFilterId],
    references: [baseFilters.id],
  }),
  fuel: one(fuels, {
    fields: [fuelsFilters.fuelId],
    references: [fuels.id],
  }),
}));
