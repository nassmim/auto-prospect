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
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_token_idx" ON "organization_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_account_id_idx" ON "organization_members" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
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
      ));--> statement-breakpoint
-- Explicit grants for organization tables
grant select, insert, update, delete on table public.organizations to authenticated, service_role;--> statement-breakpoint
grant select, insert, update, delete on table public.organization_members to authenticated, service_role;--> statement-breakpoint
grant select, insert, update, delete on table public.organization_invitations to authenticated, service_role;