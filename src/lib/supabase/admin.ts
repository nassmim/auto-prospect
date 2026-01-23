/**
 * Supabase Admin Client
 * Uses service role key to bypass RLS and perform admin operations
 *
 * SECURITY: Only use in server-side contexts (server actions, API routes, scripts)
 * Never expose service role key to client
 */

import { createClient } from '@supabase/supabase-js';

let adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Creates a Supabase admin client with service role privileges
 * Bypasses RLS and can perform admin operations like user creation
 */
export function createAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
