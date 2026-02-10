// apps/web/src/lib/db.ts
import { createClient } from "@/lib/supabase/server";
import { getDBWithRLSClient } from "@auto-prospect/db";

// C'est le remplacement de ton ancien createDrizzleSupabaseClient()
export async function createDrizzleSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return getDBWithRLSClient(session?.access_token ?? "");
}
