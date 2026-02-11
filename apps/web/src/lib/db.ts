// apps/web/src/lib/db.ts
import { createClient } from "@/lib/supabase/server";
import { getDBWithTokenClient } from "@auto-prospect/db";

// Creates the drizzle client, with RLS through supabase token
export async function createDrizzleSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return getDBWithTokenClient(session?.access_token ?? "");
}
