import { createClient } from "@supabase/supabase-js";

export const createAdminClient = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export { Session, User } from "@supabase/supabase-js";
