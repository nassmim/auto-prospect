CREATE TABLE "ad_sub_types_filter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_filter_id" uuid NOT NULL,
	"ad_sub_type_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ad_types_filter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_filter_id" uuid NOT NULL,
	"ad_type_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_types_filter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "base_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"zipcode_id" integer NOT NULL,
	"lat_center" smallint,
	"lng_center" smallint,
	"price_min" real DEFAULT 0,
	"mileage_min" real DEFAULT 0,
	"mileage_max" real,
	"model_year_min" real DEFAULT 2010,
	"model_year_max" real,
	"has_been_reposted" boolean DEFAULT false,
	"price_has_dropped" boolean DEFAULT false,
	"is_urgent" boolean DEFAULT false,
	"has_been_boosted" boolean DEFAULT false,
	"is_low_price" boolean DEFAULT false,
	"price_max" real,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "base_filters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands_filter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_filter_id" uuid NOT NULL,
	"brand_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands_filter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fuels_filter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_filter_id" uuid NOT NULL,
	"fuel_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fuels_filter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sub_types" DROP CONSTRAINT "sub_type_name";--> statement-breakpoint
ALTER TABLE "ad_types" DROP CONSTRAINT "type_name";--> statement-breakpoint
ALTER TABLE "ads" DROP CONSTRAINT "ad_original_id";--> statement-breakpoint
ALTER TABLE "brands" DROP CONSTRAINT "brand_name";--> statement-breakpoint
ALTER TABLE "driving_licences" DROP CONSTRAINT "driving_licence_name";--> statement-breakpoint
ALTER TABLE "fuels" DROP CONSTRAINT "fuel_name";--> statement-breakpoint
ALTER TABLE "gear_boxes" DROP CONSTRAINT "gear_box_name";--> statement-breakpoint
ALTER TABLE "vehicle_seats" DROP CONSTRAINT "vehicle_seats_name";--> statement-breakpoint
ALTER TABLE "vehicle_states" DROP CONSTRAINT "vehicle_state_name";--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ADD CONSTRAINT "ad_sub_types_id_fk" FOREIGN KEY ("ad_sub_type_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_types_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_types_filter" ADD CONSTRAINT "ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_zipcode_id_zipcodes_id_fk" FOREIGN KEY ("zipcode_id") REFERENCES "public"."zipcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_filter" ADD CONSTRAINT "brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuels_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuels_filter" ADD CONSTRAINT "fuels_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "public"."fuels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_types" ADD CONSTRAINT "ad_sub_type_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "ad_types" ADD CONSTRAINT "ad_type_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_original_ad_id_unique" UNIQUE("original_ad_id");--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brand_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "driving_licences" ADD CONSTRAINT "driving_licence_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "fuels" ADD CONSTRAINT "fuel_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "gear_boxes" ADD CONSTRAINT "gear_box_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "vehicle_seats" ADD CONSTRAINT "vehicle_seats_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "vehicle_states" ADD CONSTRAINT "vehicle_state_name_unique" UNIQUE("name");--> statement-breakpoint
CREATE POLICY "enable authenticated users" ON "ad_sub_types_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable authenticated users" ON "ad_types_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable all crud for authenticated users" ON "base_filters" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable authenticated users" ON "brands_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable authenticated users" ON "fuels_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);