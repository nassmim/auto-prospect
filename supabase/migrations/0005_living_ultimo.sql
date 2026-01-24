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
ALTER TABLE "hunt_channel_credits" ADD CONSTRAINT "hunt_channel_credits_hunt_id_fk" FOREIGN KEY ("hunt_id") REFERENCES "public"."hunts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hunt_channel_credits_hunt_id_idx" ON "hunt_channel_credits" USING btree ("hunt_id");--> statement-breakpoint
CREATE POLICY "enable all for hunt owners" ON "hunt_channel_credits" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from hunts h
        join organizations o on o.id = h.organization_id
        where h.id = "hunt_channel_credits"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from hunts h
        join organizations o on o.id = h.organization_id
        where h.id = "hunt_channel_credits"."hunt_id"
        and o.auth_user_id = (select auth.uid())
      ));