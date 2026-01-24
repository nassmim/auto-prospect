CREATE OR REPLACE FUNCTION public.delete_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
   -- Delete the auth user (cascade will handle personal organization deletion)
   delete from auth.users where id = auth.uid();
$function$;


-- Create personal organization for new auth users
-- This implements the organization-first architecture where:
-- - Every user has exactly ONE personal organization (type='personal')
-- - Personal org has auth_user_id set (1:1 with auth.users)
-- - Personal org has ownerId NULL (no self-reference)
-- - All user data belongs to organizations, not individual auth users
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_email text;
  new_org_id uuid;
begin
  user_email := new.email;

  -- Create personal organization (1:1 with auth.users)
  insert into public.organizations (
    auth_user_id,
    email
  )
  values (
    new.id,                    -- Link to auth.users.id
    user_email                -- User's email
  )
  on conflict (auth_user_id) do update set
    email = excluded.email
  returning id into new_org_id;

  -- Initialize credit balances for the organization (all channels start at 0)
  insert into public.credit_balances (
    organization_id,
    sms,
    ringless_voice,
    whatsapp
  )
  values (
    new_org_id,
    0,
    0,
    0
  )
  on conflict (organization_id) do nothing;

  return new;
end;
$function$;

-- ============================================================================
-- NEW: Auth triggers for personal organization creation
-- ============================================================================

-- Trigger on new user signup
-- Automatically creates a personal organization when user signs up
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();

-- Trigger on user profile update
-- Updates personal organization when user metadata changes
CREATE TRIGGER on_auth_user_updated_organization
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();
