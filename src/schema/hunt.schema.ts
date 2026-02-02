import { EHuntStatus } from "@/constants/enums";
import { accounts } from "@/schema/account.schema";
import {
  adSubTypes,
  adTypes,
  brands,
  locations,
  TAdType,
  TLocation,
} from "@/schema/ad.schema";
import { TMessageTemplateIds, TOutreachSettings } from "@/types/hunt.types";
import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  real,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

export const huntStatus = pgEnum(
  "hunt_status",
  Object.values(EHuntStatus) as [string, ...string[]],
);

export const hunts = pgTable(
  "hunts",
  {
    id: uuid().defaultRandom().primaryKey(),
    // Hunt metadata
    accountId: uuid("account_id").notNull(),
    // createdById: uuid("created_by_id").notNull(), // Who created it (for audit trail)
    typeId: smallint("type_id")
      .references(() => adTypes.id)
      .notNull(),
    // Search filter fields
    locationId: integer("location_id")
      .references(() => locations.id)
      .notNull(),
    radiusInKm: smallint().default(0).notNull(),
    name: varchar({ length: 255 }).notNull(),
    status: huntStatus().notNull().default(EHuntStatus.PAUSED),
    autoRefresh: boolean("auto_refresh").notNull().default(true),
    dailyPacingLimit: smallint("daily_pacing_limit"),
    outreachSettings: jsonb("outreach_settings")
      .$type<TOutreachSettings>()
      .default(sql`'{}'::jsonb`),
    templateIds: jsonb("template_ids")
      .$type<TMessageTemplateIds>()
      .default(sql`'{}'::jsonb`),
    lastScanAt: timestamp("last_scan_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
  (table) => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [accounts.id],
      name: "hunt_account_id_fk",
    }).onDelete("cascade"),
    // foreignKey({
    //   columns: [table.createdById],
    //   foreignColumns: [accounts.id],
    //   name: "hunt_created_by_id_fk",
    // }).onDelete("cascade"),
    index("hunt_account_id_status_idx").on(table.accountId, table.status),
    index("hunt_account_id_idx").on(table.accountId),
    // index("hunt_created_by_id_idx").on(table.createdById),
    pgPolicy("enable insert for authenticated roles", {
      as: "permissive",
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    pgPolicy("enable read update and delete for the hunt owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from accounts o
        where o.id = ${table.accountId}
        and o.auth_user_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from accounts o
        where o.id = ${table.accountId}
        and o.auth_user_id = ${authUid}
      )`,
    }),
    // // RLS: accounters can perform all operations on hunts in their org
    // pgPolicy("enable all for accounters", {
    //   as: "permissive",
    //   for: "all",
    //   to: authenticatedRole,
    //   using: sql`exists (
    //   select 1 from team_members om
    //   where om.account_id = ${table.accountId}
    //   and om.member_account_id in (
    //     select id from accounts where auth_user_id = ${authUid}
    //   )
    //   and om.joined_at is not null
    // )`,
    //   withCheck: sql`exists (
    //   select 1 from team_members om
    //   where om.account_id = ${table.accountId}
    //   and om.member_account_id in (
    //     select id from accounts where auth_user_id = ${authUid}
    //   )
    //   and om.joined_at is not null
    // )`,
    // }),
  ],
);
export type THuntInsert = InferInsertModel<typeof hunts>;

export const subTypesHunts = pgTable(
  "sub_types_hunts",
  {
    id: uuid().defaultRandom().primaryKey(),
    huntId: uuid("hunt_id").notNull(),
    subTypeId: smallint("sub_type_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.huntId],
      foreignColumns: [hunts.id],
      name: "hunt_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.subTypeId],
      foreignColumns: [adSubTypes.id],
      name: "sub_types_id_fk",
    }).onDelete("no action"),
    pgPolicy("enable all crud for the hunt owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = ${table.huntId}
        and o.auth_user_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = ${table.huntId}
        and o.auth_user_id = ${authUid}
      )`,
    }),
  ],
);
export type TSubTypeHuntInsert = InferInsertModel<typeof subTypesHunts>;
export type TSubTypeHunt = InferSelectModel<typeof subTypesHunts>;

export const brandsHunts = pgTable(
  "brands_hunts",
  {
    id: uuid().defaultRandom().primaryKey(),
    huntId: uuid("hunt_id").notNull(),
    brandId: smallint("brand_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.huntId],
      foreignColumns: [hunts.id],
      name: "hunt_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.brandId],
      foreignColumns: [brands.id],
      name: "brands_id_fk",
    }).onDelete("no action"),
    pgPolicy("enable all crud for the hunt owners", {
      as: "permissive",
      for: "all",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = ${table.huntId}
        and o.auth_user_id = ${authUid}
      )`,
      withCheck: sql`exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = ${table.huntId}
        and o.auth_user_id = ${authUid}
      )`,
    }),
  ],
);
export type TBrandsHuntInsert = InferInsertModel<typeof brandsHunts>;
export type TBrandsHunt = InferSelectModel<typeof brandsHunts>;

// export const fuelsHunts = pgTable(
//   "fuels_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//    huntId: uuid("hunt_id").notNull(),
//     fuelId: smallint("fuel_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.huntId],
//       foreignColumns: [hunts.id],
//       name: "hunt_id_fk",
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

// export const drivingLicencesHunts = pgTable(
//   "driving_licences_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//    huntId: uuid("hunt_id").notNull(),
//     drivingLicenceId: smallint("driving_licence_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.huntId],
//       foreignColumns: [hunts.id],
//       name: "hunt_id_fk",
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

// export const gearBoxesHunts = pgTable(
//   "gear_boxes_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//    huntId: uuid("hunt_id").notNull(),
//     gearBoxId: smallint("gear_box_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.huntId],
//       foreignColumns: [hunts.id],
//       name: "hunt_id_fk",
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

// export const vehicleSeatsHunts = pgTable(
//   "vehicle_seats_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//    huntId: uuid("hunt_id").notNull(),
//     vehicleSeatsId: smallint("vehicle_seats_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.huntId],
//       foreignColumns: [hunts.id],
//       name: "hunt_id_fk",
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

// export const vehicleStatesHunts = pgTable(
//   "vehicle_states_filter",
//   {
//     id: uuid().defaultRandom().primaryKey(),
//    huntId: uuid("hunt_id").notNull(),
//     vehicleStateId: smallint("vehicle_state_id").notNull(),
//   },
//   (table) => [
//     foreignKey({
//       columns: [table.huntId],
//       foreignColumns: [hunts.id],
//       name: "hunt_id_fk",
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
export const huntsRelations = relations(hunts, ({ one, many }) => ({
  account: one(accounts, {
    fields: [hunts.accountId],
    references: [accounts.id],
  }),
  location: one(locations, {
    fields: [hunts.locationId],
    references: [locations.id],
  }),
  type: one(adTypes, {
    fields: [hunts.typeId],
    references: [adTypes.id],
  }),
  subTypes: many(subTypesHunts),
  brands: many(brandsHunts),
}));

export type THunt = InferSelectModel<typeof hunts> & {
  type?: TAdType;
  location?: TLocation;
  brands?: TBrandsHunt[];
  subTypes?: TSubTypeHunt[];
};

// export const adSubTypesHuntsRelations = relations(subTypesHunts, ({ one }) => ({
//   base: one(hunts, {
//     fields: [subTypesHunts.huntId],
//     references: [hunts.id],
//   }),
//   subType: one(adSubTypes, {
//     fields: [subTypesHunts.subTypeId],
//     references: [adSubTypes.id],
//   }),
// }));

// export const brandsHuntsRelations = relations(brandsHunts, ({ one }) => ({
//   base: one(hunts, {
//     fields: [brandsHunts.huntId],
//     references: [hunts.id],
//   }),
//   brand: one(brands, {
//     fields: [brandsHunts.brandId],
//     references: [brands.id],
//   }),
// }));
