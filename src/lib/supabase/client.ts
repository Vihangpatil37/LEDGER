import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase browser client for Client Components.
 * Never uses the service-role key. Only uses the anon publishable key.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
