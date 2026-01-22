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
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "messages_lead_id_created_at_idx" ON "messages" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_external_id_idx" ON "messages" USING btree ("external_id");--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "lead_activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable insert for organization members" ON "lead_activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable all for organization members" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
-- Explicit grants for lead_activities table
grant select, insert, update, delete on table public.lead_activities to authenticated, service_role;--> statement-breakpoint
-- Explicit grants for messages table
grant select, insert, update, delete on table public.messages to authenticated, service_role;