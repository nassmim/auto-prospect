-- Custom SQL migration file, put your code below! --

-- Fix delete_user() function comment
-- The trigger (not cascade) handles account deletion
CREATE OR REPLACE FUNCTION public.delete_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
   -- Delete the auth user (trigger will handle account deletion)
   delete from auth.users where id = auth.uid();
$function$;
