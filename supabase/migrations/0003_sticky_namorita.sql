CREATE TABLE "sub_types" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"ad_type_id" smallint NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "sub_type_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sub_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ad_types" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "type_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "ad_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" smallint NOT NULL,
	"subtype_id" smallint,
	"driving_licence_id" smallint,
	"gear_box_id" smallint,
	"vehicle_seats_id" smallint,
	"vehicle_state_id" smallint,
	"zipcode_id" integer NOT NULL,
	"brand_id" integer,
	"fuel_id" smallint,
	"original_ad_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"picture" text,
	"price" double precision,
	"has_been_reposted" boolean DEFAULT false NOT NULL,
	"has_been_boosted" boolean DEFAULT false NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"model_year" smallint,
	"initial_publication_date" date NOT NULL,
	"last_publication_date" date NOT NULL,
	"mileage" real,
	"created_at" date DEFAULT now(),
	"price_has_dropped" boolean DEFAULT false NOT NULL,
	"favourite" boolean DEFAULT false NOT NULL,
	"price_min" real,
	"price_max" real,
	"is_low_price" boolean DEFAULT false NOT NULL,
	"cylynder" smallint,
	"phone_number" text,
	"owner_name" text,
	"entry_year" smallint,
	"has_phone" boolean DEFAULT false NOT NULL,
	"equipments" text,
	"other_specifications" text,
	"technical_inspection_year" smallint,
	"model" text,
	"accept_salesmen" boolean DEFAULT true,
	"lat" smallint,
	"lng" smallint,
	CONSTRAINT "ad_original_id" UNIQUE("original_ad_id")
);
--> statement-breakpoint
ALTER TABLE "ads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "brand_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "driving_licences" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "driving_licence_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "driving_licences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fuels" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "fuel_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "fuels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gear_boxes" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "gear_box_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "gear_boxes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_seats" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "vehicle_seats_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "vehicle_seats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_states" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "vehicle_state_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "vehicle_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "zipcodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"zipcode" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "zipcode_name_unique" UNIQUE("name","zipcode")
);
--> statement-breakpoint
ALTER TABLE "zipcodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sub_types" ADD CONSTRAINT "sub_types_ad_type_id_ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_type_id_ad_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_subtype_id_sub_types_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_driving_licence_id_driving_licences_id_fk" FOREIGN KEY ("driving_licence_id") REFERENCES "public"."driving_licences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_gear_box_id_gear_boxes_id_fk" FOREIGN KEY ("gear_box_id") REFERENCES "public"."gear_boxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_vehicle_seats_id_vehicle_seats_id_fk" FOREIGN KEY ("vehicle_seats_id") REFERENCES "public"."vehicle_seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_vehicle_state_id_vehicle_states_id_fk" FOREIGN KEY ("vehicle_state_id") REFERENCES "public"."vehicle_states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_zipcode_id_zipcodes_id_fk" FOREIGN KEY ("zipcode_id") REFERENCES "public"."zipcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_fuel_id_fuels_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "public"."fuels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_created_at_location_state_flags_idx" ON "ads" USING btree ("created_at","type_id","zipcode_id","accept_salesmen","has_phone","owner_name","subtype_id","vehicle_state_id","model_year","mileage","is_low_price","is_urgent","has_been_reposted","has_been_boosted","price_has_dropped","price","driving_licence_id","gear_box_id","vehicle_seats_id","brand_id","fuel_id","favourite");--> statement-breakpoint
CREATE INDEX "ads_title_search_idx" ON "ads" USING btree ("title");--> statement-breakpoint
ALTER POLICY "accounts_self_update" ON "accounts" RENAME TO "enable update for data owners";--> statement-breakpoint
ALTER POLICY "accounts_read" ON "accounts" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "create_org_account" ON "accounts" RENAME TO "enable insert for authenticated users";--> statement-breakpoint
ALTER POLICY "delete_team_account" ON "accounts" RENAME TO "enable delete for authenticated users";--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "sub_types" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "ad_types" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "ads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "brands" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "driving_licences" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "fuels" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "gear_boxes" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "vehicle_seats" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "vehicle_states" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for all users" ON "zipcodes" AS PERMISSIVE FOR SELECT TO "anon" USING (true);