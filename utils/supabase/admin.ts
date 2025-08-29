import { createClient as createAdminClient } from '@supabase/supabase-js';

// This is a server-side only client that uses the service role key
// It should only be used in API routes or server components

export function createAdmin() {
  // These environment variables should be set in your deployment environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    );
  }

  return createAdminClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
