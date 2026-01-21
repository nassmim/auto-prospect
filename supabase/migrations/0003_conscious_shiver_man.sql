CREATE TABLE "whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "whatsapp_accounts_select" ON "whatsapp_accounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = account_id);--> statement-breakpoint
CREATE POLICY "whatsapp_accounts_insert" ON "whatsapp_accounts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = account_id);--> statement-breakpoint
CREATE POLICY "whatsapp_accounts_update" ON "whatsapp_accounts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = account_id) WITH CHECK ((select auth.uid()) = account_id);--> statement-breakpoint
CREATE POLICY "whatsapp_accounts_delete" ON "whatsapp_accounts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = account_id);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "whatsapp_accounts" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "whatsapp_accounts" TO "service_role";