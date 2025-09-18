import { createBrowserClient } from "@supabase/ssr"
import { getEnv } from "@/lib/env"

export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv()
  console.log("[v0] Creating Supabase client with URL:", NEXT_PUBLIC_SUPABASE_URL)
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export { createBrowserClient }
