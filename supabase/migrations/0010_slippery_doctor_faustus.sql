DROP POLICY "enable write for organization admins" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY "enable all for organization owner" ON "organizations" CASCADE;--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "organization_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = account_id);--> statement-breakpoint
CREATE POLICY "enable update delete for organization admins" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
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
CREATE POLICY "enable delete for organization admins" ON "organization_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
        select 1 from organization_members om
        where om.organization_id = "organization_members"."organization_id"
        and om.account_id = (select auth.uid())
        and om.role in ('owner', 'admin')
        and om.joined_at is not null
      ));--> statement-breakpoint
CREATE POLICY "enable insert for authenticated users" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "enable update delete for organization owner" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "enable delete for organization owner" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = owner_id);