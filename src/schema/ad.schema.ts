import { sql, relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgPolicy,
  pgTable,
  real,
  serial,
  smallint,
  smallserial,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const ads = pgTable(
  "ads",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    typeId: smallint("type_id")
      .references(() => adTypes.id)
      .notNull(),
    subtypeId: smallint("subtype_id").references(() => adSubTypes.id),
    drivingLicenceId: smallint("driving_licence_id").references(
      () => drivingLicences.id,
    ),
    gearBoxId: smallint("gear_box_id").references(() => gearBoxes.id),
    vehicleSeatsId: smallint("vehicle_seats_id").references(
      () => vehicleSeats.id,
    ),
    vehicleStateId: smallint("vehicle_state_id").references(
      () => vehicleStates.id,
    ),
    zipcodeId: integer("zipcode_id")
      .references(() => zipcodes.id)
      .notNull(),
    brandId: integer("brand_id").references(() => brands.id),
    fuelId: smallint("fuel_id").references(() => fuels.id),
    originalAdId: text("original_ad_id").notNull(),
    url: text().notNull(),
    title: text().notNull(),
    description: text(),
    picture: text(),
    price: doublePrecision(),
    hasBeenReposted: boolean("has_been_reposted").default(false).notNull(),
    hasBeenBoosted: boolean("has_been_boosted").default(false).notNull(),
    isUrgent: boolean("is_urgent").default(false).notNull(),
    modelYear: smallint("model_year"),
    initialPublicationDate: date("initial_publication_date").notNull(),
    lastPublicationDate: date("last_publication_date").notNull(),
    mileage: real(),
    createdAt: date("created_at").defaultNow(),
    priceHasDropped: boolean("price_has_dropped").default(false).notNull(),
    favourite: boolean().default(false).notNull(),
    priceMin: real("price_min"),
    priceMax: real("price_max"),
    isLowPrice: boolean("is_low_price").default(false).notNull(),
    phoneNumber: text("phone_number"),
    isWhatsappPhone: boolean('is_whatsapp_phone').default(false),
    ownerName: text("owner_name"),
    entryYear: smallint("entry_year"),
    hasPhone: boolean("has_phone").default(false).notNull(),
    equipments: text(),
    otherSpecifications: text("other_specifications"),
    technicalInspectionYear: smallint("technical_inspection_year"),
    model: text(),
    acceptSalesmen: boolean("accept_salesmen").default(true),
    lat: smallint(),
    lng: smallint(),
  },
  (table) => [
    index("ads_created_at_location_state_flags_idx").on(
      table.createdAt,
      table.typeId,
      table.zipcodeId,
      table.acceptSalesmen,
      table.hasPhone,
      table.ownerName,
      table.subtypeId,
      table.vehicleStateId,
      table.modelYear,
      table.mileage,
      table.isLowPrice,
      table.isUrgent,
      table.hasBeenReposted,
      table.hasBeenBoosted,
      table.priceHasDropped,
      table.price,
      table.drivingLicenceId,
      table.gearBoxId,
      table.vehicleSeatsId,
      table.brandId,
      table.fuelId,
      table.favourite,
    ),
    index("ads_title_search_idx").on(table.title),
    unique("ad_original_id").on(table.originalAdId),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const adTypes = pgTable(
  "ad_types",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("type_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const adSubTypes = pgTable(
  "sub_types",
  {
    id: smallserial().primaryKey(),
    adTypeId: smallint("ad_type_id")
      .references(() => adTypes.id)
      .notNull(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("sub_type_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const drivingLicences = pgTable(
  "driving_licences",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("driving_licence_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const gearBoxes = pgTable(
  "gear_boxes",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("gear_box_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const vehicleSeats = pgTable(
  "vehicle_seats",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("vehicle_seats_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const vehicleStates = pgTable(
  "vehicle_states",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("vehicle_state_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const zipcodes = pgTable(
  "zipcodes",
  {
    id: serial().primaryKey(),
    zipcode: varchar({ length: 5 }).notNull(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("zipcode_name_unique").on(table.name, table.zipcode),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("brand_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

export const fuels = pgTable(
  "fuels",
  {
    id: smallserial().primaryKey(),
    name: text().notNull(),
    lbcValue: text("lbc_value"),
    lobstrValue: text("lobstr_value"),
  },
  (table) => [
    unique("fuel_name").on(table.name),
    pgPolicy("enable read for all users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

// Relations
export const adsRelations = relations(ads, ({ one }) => ({
  type: one(adTypes, {
    fields: [ads.typeId],
    references: [adTypes.id],
  }),
  subtype: one(adSubTypes, {
    fields: [ads.subtypeId],
    references: [adSubTypes.id],
  }),
  drivingLicence: one(drivingLicences, {
    fields: [ads.drivingLicenceId],
    references: [drivingLicences.id],
  }),
  gearBox: one(gearBoxes, {
    fields: [ads.gearBoxId],
    references: [gearBoxes.id],
  }),
  vehicleSeats: one(vehicleSeats, {
    fields: [ads.vehicleSeatsId],
    references: [vehicleSeats.id],
  }),
  vehicleState: one(vehicleStates, {
    fields: [ads.vehicleStateId],
    references: [vehicleStates.id],
  }),
  zipcode: one(zipcodes, {
    fields: [ads.zipcodeId],
    references: [zipcodes.id],
  }),
  brand: one(brands, {
    fields: [ads.brandId],
    references: [brands.id],
  }),
  fuel: one(fuels, {
    fields: [ads.fuelId],
    references: [fuels.id],
  }),
}));

export const adTypesRelations = relations(adTypes, ({ many }) => ({
  ads: many(ads),
  subTypes: many(adSubTypes),
}));

export const adSubTypesRelations = relations(adSubTypes, ({ one, many }) => ({
  adType: one(adTypes, {
    fields: [adSubTypes.adTypeId],
    references: [adTypes.id],
  }),
  ads: many(ads),
}));

export const drivingLicencesRelations = relations(drivingLicences, ({ many }) => ({
  ads: many(ads),
}));

export const gearBoxesRelations = relations(gearBoxes, ({ many }) => ({
  ads: many(ads),
}));

export const vehicleSeatsRelations = relations(vehicleSeats, ({ many }) => ({
  ads: many(ads),
}));

export const vehicleStatesRelations = relations(vehicleStates, ({ many }) => ({
  ads: many(ads),
}));

export const zipcodesRelations = relations(zipcodes, ({ many }) => ({
  ads: many(ads),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  ads: many(ads),
}));

export const fuelsRelations = relations(fuels, ({ many }) => ({
  ads: many(ads),
}));
