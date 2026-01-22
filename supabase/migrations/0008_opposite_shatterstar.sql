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
	"account_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone,
	CONSTRAINT "organization_members_org_account_key" UNIQUE("organization_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "base_filters" DROP CONSTRAINT "base_filters_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "mileage_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "model_year_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_reposted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "price_has_dropped" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_urgent" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "has_been_boosted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_low_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "created_by_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "auto_refresh" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "outreach_settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "template_ids" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "last_scan_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "base_filters" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_notes_created_by_id_idx" ON "lead_notes" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "lead_reminders_lead_id_idx" ON "lead_reminders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_reminders_due_at_idx" ON "lead_reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "lead_reminders_created_by_id_idx" ON "lead_reminders" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "leads_organization_id_stage_idx" ON "leads" USING btree ("organization_id","stage");--> statement-breakpoint
CREATE INDEX "leads_organization_id_assigned_to_id_idx" ON "leads" USING btree ("organization_id","assigned_to_id");--> statement-breakpoint
CREATE INDEX "leads_hunt_id_idx" ON "leads" USING btree ("hunt_id");--> statement-breakpoint
CREATE INDEX "leads_ad_id_idx" ON "leads" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_token_idx" ON "organization_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_account_id_idx" ON "organization_members" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "base_filters_organization_id_status_idx" ON "base_filters" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "base_filters_organization_id_idx" ON "base_filters" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "base_filters_created_by_id_idx" ON "base_filters" USING btree ("created_by_id");--> statement-breakpoint
ALTER TABLE "base_filters" DROP COLUMN "account_id";--> statement-breakpoint
DROP POLICY "enable all crud for authenticated users" ON "base_filters" CASCADE;--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "base_filters" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.account_id = (select auth.uid())
      and om.joined_at is not null
    )) WITH CHECK (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.account_id = (select auth.uid())
      and om.joined_at is not null
    ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "lead_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "lead_reminders" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "leads" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization admins" ON "organization_invitations" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_invitations"."organization_id"
        and om.account_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_invitations"."organization_id"
        and om.account_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable read by token" ON "organization_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "organization_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_members"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable write for organization admins" ON "organization_members" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_members"."organization_id"
        and om.account_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_members"."organization_id"
        and om.account_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable update for accepting invitation" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = account_id and joined_at is null) WITH CHECK ((select auth.uid()) = account_id);--> statement-breakpoint
CREATE POLICY "enable all for organization owner" ON "organizations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members
        where organization_members.organization_id = "organizations"."id"
        and organization_members.account_id = (select auth.uid())
        and organization_members.joined_at is not null
      ));