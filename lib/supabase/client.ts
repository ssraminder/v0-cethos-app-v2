"use client"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getPublicEnv } from "@/lib/env.client"

export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv()
  console.log("[v0] Creating Supabase client with URL:", NEXT_PUBLIC_SUPABASE_URL)
  return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
