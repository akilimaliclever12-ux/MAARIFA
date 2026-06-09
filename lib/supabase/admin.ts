import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY admin client. Uses the service-role key and BYPASSES RLS.
// Use ONLY in trusted server code (moderation/admin actions). NEVER import in
// a Client Component or anything shipped to the browser.
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must never run in the browser.');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
