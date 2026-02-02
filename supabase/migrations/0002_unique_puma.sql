CREATE TYPE "public"."credit_type" AS ENUM('whatsappText', 'sms', 'ringlessVoice');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'usage', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('whatsappText', 'sms', 'ringlessVoice');--> statement-breakpoint
CREATE TYPE "public"."hunt_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('nouveau', 'contacte', 'relance', 'gagne', 'perdu');--> statement-breakpoint
CREATE TYPE "public"."lead_activity_type" AS ENUM('stage_change', 'message_sent', 'assignment_change', 'note_added', 'reminder_set', 'created');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('whatsapp', 'phone');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'read', 'replied');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('personal', 'team');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
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
	"account_id" uuid NOT NULL,
	"message_type" "message_type" NOT NULL,
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
	"account_id" uuid NOT NULL,
	"sms" integer DEFAULT 0 NOT NULL,
	"ringless_voice" integer DEFAULT 0 NOT NULL,
	"whatsapp" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balances_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
ALTER TABLE "credit_balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_packs" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"creditType" "credit_type" NOT NULL,
	"credits" integer NOT NULL,
	"price_eur" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_packs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hunt_channel_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hunt_id" uuid NOT NULL,
	"channel" "credit_type" NOT NULL,
	"credits_allocated" integer DEFAULT 0 NOT NULL,
	"credits_consumed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_channel_unique" UNIQUE("hunt_id","channel")
);
--> statement-breakpoint
ALTER TABLE "hunt_channel_credits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"sms_alerts" boolean DEFAULT false,
	"slack_alerts" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "brands_hunts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hunt_id" uuid NOT NULL,
	"brand_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands_hunts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hunts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"type_id" smallint NOT NULL,
	"location_id" integer NOT NULL,
	"radiusInKm" smallint DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "hunt_status" DEFAULT 'paused' NOT NULL,
	"auto_refresh" boolean DEFAULT true NOT NULL,
	"daily_pacing_limit" smallint,
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
ALTER TABLE "hunts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sub_types_hunts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hunt_id" uuid NOT NULL,
	"sub_type_id" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sub_types_hunts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"hunt_id" uuid NOT NULL,
	"ad_id" uuid NOT NULL,
	"stage" "lead_stage" DEFAULT 'nouveau' NOT NULL,
	"assigned_to_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_account_id_ad_id_key" UNIQUE("account_id","ad_id")
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channel_priorities" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"channel" "message_type" NOT NULL,
	"priority" "smallserial" NOT NULL,
	CONSTRAINT "channel_priorities_channel_unique" UNIQUE("channel"),
	CONSTRAINT "channel_priorities_priority_unique" UNIQUE("priority")
);
--> statement-breakpoint
ALTER TABLE "channel_priorities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_activity_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "message_type" NOT NULL,
	"channel" "message_channel",
	"content" text,
	"audio_url" text,
	"audio_duration" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"template_id" uuid,
	"channel" "message_channel" NOT NULL,
	"content" text NOT NULL,
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"external_id" varchar(255),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "template_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	CONSTRAINT "template_variables_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "organisation_id_member_name_unique" UNIQUE("account_id","name")
);
--> statement-breakpoint
ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"name" varchar(255),
	"email" varchar(320) NOT NULL,
	"picture_url" varchar(1000),
	"phone_number" varchar(14),
	"type" "account_type" DEFAULT 'personal' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hunt_channel_credits" ADD CONSTRAINT "hunt_channel_credits_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_hunts" ADD CONSTRAINT "hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands_hunts" ADD CONSTRAINT "brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hunts" ADD CONSTRAINT "hunts_type_id_ad_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hunts" ADD CONSTRAINT "hunts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hunts" ADD CONSTRAINT "hunt_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_types_hunts" ADD CONSTRAINT "hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_types_hunts" ADD CONSTRAINT "sub_types_id_fk" FOREIGN KEY ("sub_type_id") REFERENCES "public"."sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_hunt_id_hunts_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_account_members_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "auth_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_created_at_location_state_flags_idx" ON "ads" USING btree ("created_at","type_id","location_id","accept_salesmen","has_phone","owner_name","subtype_id","vehicle_state_id","model_year","mileage","is_low_price","is_urgent","has_been_reposted","has_been_boosted","price_has_dropped","price","driving_licence_id","gear_box_id","vehicle_seats_id","brand_id","fuel_id","favourite");--> statement-breakpoint
CREATE INDEX "ads_title_search_idx" ON "ads" USING btree ("title");--> statement-breakpoint
CREATE INDEX "locations_geo_idx" ON "locations" USING gist ((ST_MakePoint("lng", "lat")::geography));--> statement-breakpoint
CREATE INDEX "credit_balances_account_id_idx" ON "credit_balances" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "credit_packs_credit_type_idx" ON "credit_packs" USING btree ("creditType");--> statement-breakpoint
CREATE INDEX "credit_transactions_org_created_idx" ON "credit_transactions" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_reference_id_idx" ON "credit_transactions" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "hunt_channel_credits_hunt_id_idx" ON "hunt_channel_credits" USING btree ("hunt_id");--> statement-breakpoint
CREATE INDEX "hunt_account_id_status_idx" ON "hunts" USING btree ("account_id","status");--> statement-breakpoint
CREATE INDEX "hunt_account_id_idx" ON "hunts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "leads_account_id_stage_idx" ON "leads" USING btree ("account_id","stage");--> statement-breakpoint
CREATE INDEX "leads_account_id_assigned_to_id_idx" ON "leads" USING btree ("account_id","assigned_to_id");--> statement-breakpoint
CREATE INDEX "leads_hunt_id_idx" ON "leads" USING btree ("hunt_id");--> statement-breakpoint
CREATE INDEX "leads_ad_id_idx" ON "leads" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "messages_lead_id_created_at_idx" ON "messages" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_external_id_idx" ON "messages" USING btree ("external_id");--> statement-breakpoint
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
CREATE POLICY "enable read for credit walet owners" ON "credit_balances" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from accounts o
        where o.id = "credit_balances"."account_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "credit_packs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for transaction owners" ON "credit_transactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
            select 1 from accounts o
            where o.id = "credit_transactions"."account_id"
            and o.auth_user_id = (select auth.uid())
          ));--> statement-breakpoint
CREATE POLICY "enable all for hunt owners" ON "hunt_channel_credits" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "hunt_channel_credits"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "hunt_channel_credits"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all crud for the hunt owners" ON "brands_hunts" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "brands_hunts"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "brands_hunts"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable insert for authenticated roles" ON "hunts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read update and delete for the hunt owners" ON "hunts" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from accounts o
        where o.id = "hunts"."account_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from accounts o
        where o.id = "hunts"."account_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all crud for the hunt owners" ON "sub_types_hunts" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "sub_types_hunts"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from hunts h
        join accounts o on o.id = h.account_id
        where h.id = "sub_types_hunts"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all for owners of the associated account" ON "leads" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
            select 1 from accounts o
            where o.id = "leads"."account_id"
            and o.auth_user_id = (select auth.uid())
          )) WITH CHECK (exists (
            select 1 from accounts o
            where o.id = "leads"."account_id"
            and o.auth_user_id = (select auth.uid())
          ));--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "channel_priorities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for account owners" ON "lead_activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from leads l
        join accounts o on o.id = l.account_id
        where l.id = "lead_activities"."lead_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable insert for account owners" ON "lead_activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
              select 1 from leads l
        join accounts o on o.id = l.account_id
        where l.id = "lead_activities"."lead_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all for owners of the associated account" ON "message_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
            select 1 from accounts o
            where o.id = "message_templates"."account_id"
            and o.auth_user_id = (select auth.uid())
          )) WITH CHECK (exists (
            select 1 from accounts o
            where o.id = "message_templates"."account_id"
            and o.auth_user_id = (select auth.uid())
          ));--> statement-breakpoint
CREATE POLICY "enable all for account owners" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join accounts o on o.id = l.account_id
        where l.id = "messages"."lead_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from leads l
        join accounts o on o.id = l.account_id
        where l.id = "messages"."lead_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all for account owners" ON "team_members" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from accounts o
        where o.id = "team_members"."account_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from accounts o
        where o.id = "team_members"."account_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable update for account owners" ON "accounts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        (select auth.uid()) = auth_user_id) WITH CHECK (
        (select auth.uid()) = auth_user_id);--> statement-breakpoint
CREATE POLICY "enable delete for account owners" ON "accounts" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        (select auth.uid()) = "accounts"."auth_user_id" 
      );--> statement-breakpoint
CREATE POLICY "enable read for account owners" ON "accounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        (select auth.uid()) = auth_user_id);