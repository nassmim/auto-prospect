-- Create leads table with pipeline tracking
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
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;

-- Create lead_notes table for activity logging
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;

-- Create lead_reminders table for follow-ups
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
ALTER TABLE "lead_reminders" ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints for leads
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."base_filters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;

-- Add foreign key constraints for lead_notes
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

-- Add foreign key constraints for lead_reminders
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for leads
CREATE INDEX "leads_organization_id_stage_idx" ON "leads" USING btree ("organization_id","stage");
CREATE INDEX "leads_organization_id_assigned_to_id_idx" ON "leads" USING btree ("organization_id","assigned_to_id");
CREATE INDEX "leads_hunt_id_idx" ON "leads" USING btree ("hunt_id");
CREATE INDEX "leads_ad_id_idx" ON "leads" USING btree ("ad_id");

-- Create indexes for lead_notes
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" USING btree ("lead_id");
CREATE INDEX "lead_notes_created_by_id_idx" ON "lead_notes" USING btree ("created_by_id");

-- Create indexes for lead_reminders
CREATE INDEX "lead_reminders_lead_id_idx" ON "lead_reminders" USING btree ("lead_id");
CREATE INDEX "lead_reminders_due_at_idx" ON "lead_reminders" USING btree ("due_at");
CREATE INDEX "lead_reminders_created_by_id_idx" ON "lead_reminders" USING btree ("created_by_id");

-- RLS policy for leads
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
));

-- RLS policy for lead_notes
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
));

-- RLS policy for lead_reminders
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
));

-- Explicit grants for leads tables
grant select, insert, update, delete on table public.leads to authenticated, service_role;
grant select, insert, update, delete on table public.lead_notes to authenticated, service_role;
grant select, insert, update, delete on table public.lead_reminders to authenticated, service_role;
