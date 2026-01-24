CREATE TABLE "hunt_daily_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hunt_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_contacts" integer DEFAULT 0 NOT NULL,
	"sms_contacts" integer DEFAULT 0 NOT NULL,
	"whatsapp_contacts" integer DEFAULT 0 NOT NULL,
	"ringless_voice_contacts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_date_unique" UNIQUE("hunt_id","date")
);
--> statement-breakpoint
ALTER TABLE "hunt_daily_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hunt_daily_contacts" ADD CONSTRAINT "hunt_daily_contacts_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hunt_daily_contacts_hunt_id_date_idx" ON "hunt_daily_contacts" USING btree ("hunt_id","date");--> statement-breakpoint
CREATE POLICY "enable read for hunt owners" ON "hunt_daily_contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from hunts h
        join organizations o on o.id = h.organization_id
        where h.id = "hunt_daily_contacts"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "enable all for service role" ON "hunt_daily_contacts" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."hunt_daily_contacts" TO "authenticated", "service_role";