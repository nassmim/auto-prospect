CREATE TYPE "public"."message_type" AS ENUM('whatsappText', 'sms', 'ringlessVoice');--> statement-breakpoint
CREATE TABLE "contacted_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"message_type_id" smallint NOT NULL,
	"created_at" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacted_ads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"sms_alerts" boolean DEFAULT false,
	"slack_alerts" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_types" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" "message_type",
	CONSTRAINT "message_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "message_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ad_types_filter" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fuels_filter" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "enable all crud for authenticated users" ON "ad_types_filter" CASCADE;--> statement-breakpoint
DROP TABLE "ad_types_filter" CASCADE;--> statement-breakpoint
DROP POLICY "enable all crud for authenticated users" ON "fuels_filter" CASCADE;--> statement-breakpoint
DROP TABLE "fuels_filter" CASCADE;--> statement-breakpoint
ALTER TABLE "zipcodes" RENAME TO "locations";--> statement-breakpoint
ALTER TABLE "ads" RENAME COLUMN "zipcode_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" RENAME COLUMN "ad_sub_type_id" TO "sub_type_id";--> statement-breakpoint
ALTER TABLE "base_filters" RENAME COLUMN "zipcode_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "ads" DROP CONSTRAINT "ads_zipcode_id_zipcodes_id_fk";
--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" DROP CONSTRAINT "ad_sub_types_id_fk";
--> statement-breakpoint
ALTER TABLE "base_filters" DROP CONSTRAINT "base_filters_zipcode_id_zipcodes_id_fk";
--> statement-breakpoint
DROP INDEX "ads_created_at_location_state_flags_idx";--> statement-breakpoint
ALTER TABLE "ads" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ALTER COLUMN "owner_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ALTER COLUMN "accept_salesmen" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "mileage_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "model_year_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_reposted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_has_dropped" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_urgent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_boosted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_low_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "lat" real NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "lng" real NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "ad_type_id" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "radiusInKm" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_message_type_id_message_types_id_fk" FOREIGN KEY ("message_type_id") REFERENCES "public"."message_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ADD CONSTRAINT "ad_sub_types_id_fk" FOREIGN KEY ("sub_type_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_ad_type_id_ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_geo_idx" ON "locations" USING gist (ST_MakePoint("lng", "lat")::geography);--> statement-breakpoint
CREATE INDEX "ads_created_at_location_state_flags_idx" ON "ads" USING btree ("created_at","type_id","location_id","accept_salesmen","has_phone","owner_name","subtype_id","vehicle_state_id","model_year","mileage","is_low_price","is_urgent","has_been_reposted","has_been_boosted","price_has_dropped","price","driving_licence_id","gear_box_id","vehicle_seats_id","brand_id","fuel_id","favourite");--> statement-breakpoint
ALTER TABLE "ads" DROP COLUMN "lat";--> statement-breakpoint
ALTER TABLE "ads" DROP COLUMN "lng";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "lbc_value";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "lobstr_value";--> statement-breakpoint
ALTER TABLE "base_filters" DROP COLUMN "lat_center";--> statement-breakpoint
ALTER TABLE "base_filters" DROP COLUMN "lng_center";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "sub_types" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "ad_types" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "brands" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "driving_licences" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "fuels" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "gear_boxes" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "vehicle_seats" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "vehicle_states" RENAME TO "enable read for authenticated users";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "locations" RENAME TO "enable read for authenticated users";--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable update for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR SELECT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read for admin users" ON "app_settings" AS PERMISSIVE FOR SELECT TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "message_types" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);