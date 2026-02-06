CREATE TABLE "whatsapp_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"credentials" text,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_sessions_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "whatsapp_phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "enable select for own session" ON "whatsapp_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "whatsapp_sessions"."account_id");--> statement-breakpoint
CREATE POLICY "enable insert for own session" ON "whatsapp_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "whatsapp_sessions"."account_id");--> statement-breakpoint
CREATE POLICY "enable update for own session" ON "whatsapp_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "whatsapp_sessions"."account_id") WITH CHECK ((select auth.uid()) = "whatsapp_sessions"."account_id");--> statement-breakpoint
CREATE POLICY "enable delete for own session" ON "whatsapp_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "whatsapp_sessions"."account_id");