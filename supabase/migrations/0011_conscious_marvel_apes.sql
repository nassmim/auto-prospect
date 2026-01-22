CREATE TABLE "credit_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sms_credits" integer DEFAULT 0 NOT NULL,
	"voice_credits" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_balances_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "credit_balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"credit_type" varchar(10) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_balances_organization_id_idx" ON "credit_balances" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_org_created_idx" ON "credit_transactions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_reference_id_idx" ON "credit_transactions" USING btree ("reference_id");--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "credit_balances" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_balances"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable update for service role" ON "credit_balances" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable insert for service role" ON "credit_balances" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "enable read for organization members" ON "credit_transactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_transactions"."organization_id"
        and om.account_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable insert for service role" ON "credit_transactions" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
-- Explicit grants for credit_balances table
grant select, insert, update, delete on table public.credit_balances to authenticated, service_role;--> statement-breakpoint
-- Explicit grants for credit_transactions table
grant select, insert, update, delete on table public.credit_transactions to authenticated, service_role;