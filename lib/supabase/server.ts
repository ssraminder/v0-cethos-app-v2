import { createClient } from "@supabase/supabase-js"
import { getServerEnv } from "@/lib/environment.server"

// Export createSupabaseClient function to match import pattern
export async function createServerClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getServerEnv()

  // Use regular Supabase client for server operations
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createSupabaseClient() {
  return createServerClient()
}
