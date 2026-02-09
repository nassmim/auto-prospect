ALTER TABLE "accounts" ADD COLUMN "sms_mobile_api_allowed" boolean DEFAULT false;--> statement-breakpoint
DROP POLICY "enable select for own session" ON "whatsapp_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "enable insert for own session" ON "whatsapp_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "enable update for own session" ON "whatsapp_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "enable delete for own session" ON "whatsapp_sessions" CASCADE;--> statement-breakpoint
CREATE POLICY "enable all for own session" ON "whatsapp_sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "whatsapp_sessions"."account_id") WITH CHECK ((select auth.uid()) = "whatsapp_sessions"."account_id");