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
ALTER TABLE "contacted_ads" DROP CONSTRAINT "contacted_ads_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "mileage_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "model_year_min" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_reposted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_has_dropped" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_urgent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_boosted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_low_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_organization_id_accounts_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacted_ads" DROP COLUMN "account_id";--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "message_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));