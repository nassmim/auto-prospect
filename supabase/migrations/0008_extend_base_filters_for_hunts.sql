-- Extend base_filters table to support hunt (saved search) functionality
-- Add organization-level fields and hunt metadata

ALTER TABLE "base_filters" ADD COLUMN "organization_id" uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "base_filters" ADD COLUMN "name" varchar(255) NOT NULL DEFAULT 'Unnamed Hunt';
ALTER TABLE "base_filters" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'active';
ALTER TABLE "base_filters" ADD COLUMN "auto_refresh" boolean NOT NULL DEFAULT true;
ALTER TABLE "base_filters" ADD COLUMN "outreach_settings" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "base_filters" ADD COLUMN "template_ids" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "base_filters" ADD COLUMN "last_scan_at" timestamp with time zone;
ALTER TABLE "base_filters" ADD COLUMN "created_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "base_filters" ADD COLUMN "created_by_id" uuid NOT NULL DEFAULT gen_random_uuid();

-- Add foreign key constraints
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

-- Add indexes for performance
CREATE INDEX "base_filters_organization_id_status_idx" ON "base_filters" USING btree ("organization_id","status");
CREATE INDEX "base_filters_organization_id_idx" ON "base_filters" USING btree ("organization_id");
CREATE INDEX "base_filters_created_by_id_idx" ON "base_filters" USING btree ("created_by_id");

-- Drop old RLS policy
DROP POLICY IF EXISTS "enable all crud for authenticated users" ON "base_filters";

-- Add new RLS policy for organization members
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
));

-- Explicit grants
grant select, insert, update, delete on table public.base_filters to authenticated, service_role;
