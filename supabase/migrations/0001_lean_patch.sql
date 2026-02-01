CREATE OR REPLACE FUNCTION public.delete_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
   delete from auth.users where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.accounts (id, name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'Nouvel utilisateur'
    ),
    new.email
  )
  on conflict (id) do update set
    name = coalesce(
      excluded.name,
      public.accounts.name
    ),
    email = excluded.email;

  return new;
end;
$function$;

-- Trigger on new signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger on profile update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();