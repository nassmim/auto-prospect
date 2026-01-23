ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "enable update for data owners" ON "accounts" CASCADE;--> statement-breakpoint
DROP POLICY "enable read for authenticated users" ON "accounts" CASCADE;--> statement-breakpoint
DROP POLICY "enable insert for authenticated users" ON "accounts" CASCADE;--> statement-breakpoint
DROP POLICY "enable delete for authenticated users" ON "accounts" CASCADE;--> statement-breakpoint
DROP TABLE "accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_org_account_key";--> statement-breakpoint
ALTER TABLE "contacted_ads" DROP CONSTRAINT "contacted_ads_organization_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "base_filters" DROP CONSTRAINT "base_filters_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_notes" DROP CONSTRAINT "lead_notes_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_reminders" DROP CONSTRAINT "lead_reminders_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_assigned_to_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_sent_by_id_fk";
--> statement-breakpoint
ALTER TABLE "message_templates" DROP CONSTRAINT "message_templates_created_by_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_account_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_fk";
--> statement-breakpoint
DROP INDEX "organization_members_account_id_idx";--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "settings" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "member_organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "email" varchar(320);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "picture_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "phone_number" varchar(14);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "type" varchar(20) DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacted_ads" ADD CONSTRAINT "contacted_ads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_filters" ADD CONSTRAINT "base_filters_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_member_organization_id_fk" FOREIGN KEY ("member_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_members_member_organization_id_idx" ON "organization_members" USING btree ("member_organization_id");--> statement-breakpoint
CREATE INDEX "organizations_auth_user_id_idx" ON "organizations" USING btree ("auth_user_id");--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_member_key" UNIQUE("organization_id","member_organization_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_auth_user_id_key" UNIQUE("auth_user_id");--> statement-breakpoint
DROP POLICY "enable update delete for organization owner" ON "organizations" CASCADE;--> statement-breakpoint
CREATE POLICY "enable update for organization owner" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      ) WITH CHECK (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role in ('owner', 'admin')
          and om.joined_at is not null
        )
      );--> statement-breakpoint
ALTER POLICY "enable read for organization members" ON "credit_balances" TO authenticated USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_balances"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable read for organization members" ON "credit_transactions" TO authenticated USING (exists (
        select 1 from organization_members om
        where om.organization_id = "credit_transactions"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "base_filters" TO authenticated USING (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.member_organization_id in (
        select id from organizations where auth_user_id = (select auth.uid())
      )
      and om.joined_at is not null
    )) WITH CHECK (exists (
      select 1 from organization_members om
      where om.organization_id = "base_filters"."organization_id"
      and om.member_organization_id in (
        select id from organizations where auth_user_id = (select auth.uid())
      )
      and om.joined_at is not null
    ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "lead_notes" TO authenticated USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_notes"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "lead_reminders" TO authenticated USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_reminders"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "leads" TO authenticated USING (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "leads"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable read for organization members" ON "lead_activities" TO authenticated USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable insert for organization members" ON "lead_activities" TO authenticated WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "lead_activities"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "messages" TO authenticated USING (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from leads l
        join organization_members om on om.organization_id = l.organization_id
        where l.id = "messages"."lead_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization members" ON "message_templates" TO authenticated USING (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        where om.organization_id = "message_templates"."organization_id"
        and om.member_organization_id in (
          select id from organizations where auth_user_id = (select auth.uid())
        )
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable all for organization admins" ON "organization_invitations" TO authenticated USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_invitations"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_invitations"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable insert for authenticated users" ON "organization_members" TO authenticated WITH CHECK (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
        and o.type = 'personal'
      ));--> statement-breakpoint
ALTER POLICY "enable read for organization members" ON "organization_members" TO authenticated USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable update delete for organization admins" ON "organization_members" TO authenticated USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      )) WITH CHECK (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable delete for organization admins" ON "organization_members" TO authenticated USING (exists (
        select 1 from organization_members om
        join organizations o on o.id = om.member_organization_id
        where om.organization_id = "organization_members"."organization_id"
        and o.auth_user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
ALTER POLICY "enable update for accepting invitation" ON "organization_members" TO authenticated USING (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
      ) and joined_at is null) WITH CHECK (exists (
        select 1 from organizations o
        where o.id = member_organization_id
        and o.auth_user_id = (select auth.uid())
      ));--> statement-breakpoint
ALTER POLICY "enable insert for authenticated users" ON "organizations" TO authenticated WITH CHECK (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organizations o
          where o.auth_user_id = (select auth.uid())
          and o.type = 'personal'
        )
      );--> statement-breakpoint
ALTER POLICY "enable delete for organization owner" ON "organizations" TO authenticated USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.role = 'owner'
          and om.joined_at is not null
        )
      );--> statement-breakpoint
ALTER POLICY "enable read for organization members" ON "organizations" TO authenticated USING (
        (select auth.uid()) = auth_user_id OR
        exists (
          select 1 from organization_members om
          join organizations o on o.id = om.member_organization_id
          where om.organization_id = "organizations"."id"
          and o.auth_user_id = (select auth.uid())
          and om.joined_at is not null
        )
      );