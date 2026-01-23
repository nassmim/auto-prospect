create extension postgis with schema "extensions";

CREATE TYPE "public"."message_type" AS ENUM('whatsappText', 'sms', 'ringlessVoice');--> statement-breakpoint
CREATE TABLE "sub_types" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"ad_type_id" smallint NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "ad_sub_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sub_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ad_types" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "ad_type_name_unique" UNIQUE("name")
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
	"location_id" integer NOT NULL,
	"brand_id" integer,
	"fuel_id" smallint,
	"url" text NOT NULL,
	"original_ad_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"picture" text,
	"price" double precision NOT NULL,
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
	"phone_number" text,
	"is_whatsapp_phone" boolean DEFAULT false,
	"owner_name" text NOT NULL,
	"entry_year" smallint,
	"has_phone" boolean DEFAULT false NOT NULL,
	"equipments" text,
	"other_specifications" text,
	"technical_inspection_year" smallint,
	"model" text,
	"accept_salesmen" boolean DEFAULT true NOT NULL,
	CONSTRAINT "ads_original_ad_id_unique" UNIQUE("original_ad_id")
);
--> statement-breakpoint
ALTER TABLE "ads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "brand_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contacted_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"message_type_id" smallint NOT NULL,
	"created_at" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacted_ads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "driving_licences" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "driving_licence_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "driving_licences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fuels" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "fuel_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "fuels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gear_boxes" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "gear_box_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "gear_boxes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"zipcode" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	CONSTRAINT "zipcode_name_unique" UNIQUE("name","zipcode")
);
--> statement-breakpoint
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_seats" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "vehicle_seats_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "vehicle_seats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_states" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lbc_value" text,
	"lobstr_value" text,
	CONSTRAINT "vehicle_state_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "vehicle_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sms_credits" integer DEFAULT 0 NOT NULL,
	"voice_credits" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balances_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "credit_balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"credit_type" varchar(10) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ad_sub_types_filter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_filter_id" uuid NOT NULL,
	"sub_type_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "base_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"ad_type_id" smallint NOT NULL,
	"location_id" integer NOT NULL,
	"radiusInKm" smallint DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"auto_refresh" boolean DEFAULT true NOT NULL,
	"outreach_settings" jsonb DEFAULT '{}'::jsonb,
	"template_ids" jsonb DEFAULT '{}'::jsonb,
	"last_scan_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"price_min" real DEFAULT 0 NOT NULL,
	"mileage_min" real DEFAULT 0 NOT NULL,
	"mileage_max" real,
	"model_year_min" real DEFAULT 2010 NOT NULL,
	"model_year_max" real,
	"has_been_reposted" boolean DEFAULT false NOT NULL,
	"price_has_dropped" boolean DEFAULT false NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"has_been_boosted" boolean DEFAULT false NOT NULL,
	"is_low_price" boolean DEFAULT false NOT NULL,
	"price_max" real,
	"is_active" boolean DEFAULT true NOT NULL
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
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"note" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"hunt_id" uuid NOT NULL,
	"ad_id" uuid NOT NULL,
	"stage" varchar(20) DEFAULT 'nouveau' NOT NULL,
	"assigned_to_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_organization_id_ad_id_key" UNIQUE("organization_id","ad_id")
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"template_id" uuid,
	"channel" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"external_id" varchar(255),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"channel" varchar(20),
	"content" text,
	"audio_url" text,
	"audio_duration" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "template_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "template_variables_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "organization_invitations_token_key" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_organization_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone,
	CONSTRAINT "organization_members_org_member_key" UNIQUE("organization_id","member_organization_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"name" varchar(255),
	"email" varchar(320) NOT NULL,
	"picture_url" varchar(1000),
	"phone_number" varchar(14),
	"type" varchar(20) DEFAULT 'personal' NOT NULL,
	"owner_id" uuid,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_auth_user_id_key" UNIQUE("auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sub_types" ADD CONSTRAINT "sub_types_ad_type_id_ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_type_id_ad_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_subtype_id_sub_types_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_driving_licence_id_driving_licences_id_fk" FOREIGN KEY ("driving_licence_id") REFERENCES "public"."driving_licences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_gear_box_id_gear_boxes_id_fk" FOREIGN KEY ("gear_box_id") REFERENCES "public"."gear_boxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_vehicle_seats_id_vehicle_seats_id_fk" FOREIGN KEY ("vehicle_seats_id") REFERENCES "public"."vehicle_seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_vehicle_state_id_vehicle_states_id_fk" FOREIGN KEY ("vehicle_state_id") REFERENCES "public"."vehicle_states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_fuel_id_fuels_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "public"."fuels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_message_type_id_message_types_id_fk" FOREIGN KEY ("message_type_id") REFERENCES "public"."message_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_sub_types_filter" ADD CONSTRAINT "ad_sub_types_id_fk" FOREIGN KEY ("sub_type_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_ad_type_id_ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_filter" ADD CONSTRAINT "base_filters_id_fk" FOREIGN KEY ("base_filter_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_filter" ADD CONSTRAINT "brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_member_organization_id_fk" FOREIGN KEY ("member_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_created_at_location_state_flags_idx" ON "ads" USING btree ("created_at","type_id","location_id","accept_salesmen","has_phone","owner_name","subtype_id","vehicle_state_id","model_year","mileage","is_low_price","is_urgent","has_been_reposted","has_been_boosted","price_has_dropped","price","driving_licence_id","gear_box_id","vehicle_seats_id","brand_id","fuel_id","favourite");--> statement-breakpoint
CREATE INDEX "ads_title_search_idx" ON "ads" USING btree ("title");--> statement-breakpoint
CREATE INDEX "locations_geo_idx" ON "locations" USING gist ((ST_MakePoint("lng", "lat")::geography));--> statement-breakpoint
CREATE INDEX "credit_balances_organization_id_idx" ON "credit_balances" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_org_created_idx" ON "credit_transactions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_reference_id_idx" ON "credit_transactions" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "base_filters_organization_id_status_idx" ON "base_filters" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "base_filters_organization_id_idx" ON "base_filters" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "base_filters_created_by_id_idx" ON "base_filters" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_notes_created_by_id_idx" ON "lead_notes" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "lead_reminders_lead_id_idx" ON "lead_reminders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_reminders_due_at_idx" ON "lead_reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "lead_reminders_created_by_id_idx" ON "lead_reminders" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "leads_organization_id_stage_idx" ON "leads" USING btree ("organization_id","stage");--> statement-breakpoint
CREATE INDEX "leads_organization_id_assigned_to_id_idx" ON "leads" USING btree ("organization_id","assigned_to_id");--> statement-breakpoint
CREATE INDEX "leads_hunt_id_idx" ON "leads" USING btree ("hunt_id");--> statement-breakpoint
CREATE INDEX "leads_ad_id_idx" ON "leads" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "messages_lead_id_created_at_idx" ON "messages" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_external_id_idx" ON "messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_token_idx" ON "organization_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_member_organization_id_idx" ON "organization_members" USING btree ("member_organization_id");--> statement-breakpoint
CREATE INDEX "organizations_auth_user_id_idx" ON "organizations" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "sub_types" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "ad_types" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "ads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "brands" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable update for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "contacted_ads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "driving_licences" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "fuels" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "gear_boxes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "locations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "vehicle_seats" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "vehicle_states" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "credit_balances" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_balances"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable update for service role" ON "credit_balances" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable insert for service role" ON "credit_balances" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "credit_transactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_transactions"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable insert for service role" ON "credit_transactions" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable all crud for authenticated users" ON "ad_sub_types_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "base_filters" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.member_organization_id in (
        select id from organizations where auth_user_id = (select auth.uid())
      )
      and om.joined_at is not null
    )) WITH CHECK (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.member_organization_id in (
        select id from organizations where auth_user_id = (select auth.uid())
      )
      and om.joined_at is not null
    ));--> statement-breakpoint
CREATE POLICY "enable all crud for authenticated users" ON "brands_filter" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read for admin users" ON "app_settings" AS PERMISSIVE FOR SELECT TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "message_types" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "lead_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "lead_reminders" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "leads" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "lead_activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable insert for organization members" ON "lead_activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "message_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization admins" ON "organization_invitations" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_invitations"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_invitations"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable read by token" ON "organization_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "organization_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
        and o.type = 'personal'
      ));--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "organization_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable update delete for organization admins" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable delete for organization admins" ON "organization_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable update for accepting invitation" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
      ) and joined_at is null) WITH CHECK (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organizations o
          where o.auth_user_id = (select auth.uid())
          and o.type = 'personal'
        )
      );--> statement-breakpoint
CREATE POLICY "enable update for organization owner" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      ) WITH CHECK (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      );--> statement-breakpoint
CREATE POLICY "enable delete for organization owner" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role = 'owner'
          and om.joined_at is not null
        )
      );--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.joined_at is not null
        )
      );