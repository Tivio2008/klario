import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Anonymous client — no cookie handling, uses anon key only.
// Safe to use in public/preview pages for unauthenticated access.
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
