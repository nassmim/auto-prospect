CREATE OR REPLACE FUNCTION public.delete_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
   -- Delete the auth user (cascade will handle personal account deletion)
   delete from auth.users where id = auth.uid();
$function$;


-- Create personal account for new auth users
-- This implements the account-first architecture where:
-- - Every user has exactly ONE personal account (type='personal')
-- - All user data belongs to accounts, not individual auth users
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_email text;
  new_account_id uuid;
begin
  user_email := new.email;

  -- Create personal account (1:1 with auth.users)
  insert into public.accounts (
    id,
    email
  )
  values (
    new.id,                    -- Link to auth.users.id
    user_email                -- User's email
  )
  on conflict (id) do update set
    email = excluded.email
  returning id into new_account_id;

  return new;
end;
$function$;

-- Trigger on new user signup
-- Automatically creates a personal account when user signs up
CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_account();

-- Trigger on user profile update
-- Updates personal account when user metadata changes
CREATE TRIGGER on_auth_user_updated_account
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_account();