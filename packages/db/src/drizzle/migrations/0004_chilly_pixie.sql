-- Custom SQL migration file, put your code below! --

-- Cascade delete account when auth user is deleted
-- Since we don't use FK constraints to auth schema, we need a trigger
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Delete the corresponding account record
  delete from public.accounts where id = old.id;
  return old;
end;
$function$;

-- Trigger on user deletion
-- Automatically deletes the personal account when auth user is deleted
DROP TRIGGER IF EXISTS on_auth_user_deleted_account ON auth.users;
CREATE TRIGGER on_auth_user_deleted_account
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();
