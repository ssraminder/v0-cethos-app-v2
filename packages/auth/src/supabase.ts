import { createClient } from "@supabase/supabase-js"
import type { NextRequest, NextResponse } from "next/server"
import { getServerEnv } from "@/lib/environment.server"
import { getPublicEnv } from "@/lib/environment.client"

/**
 * Create a Supabase client for browser-side operations
 */
export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv()
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Create a Supabase client for server-side operations
 */
export function createSupabaseServerClient(request: NextRequest, response: NextResponse) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getServerEnv()
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Create a Supabase service client for admin operations
 */
export function createSupabaseServiceClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getServerEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey)
}

/**
 * Singleton pattern for browser client
 */
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient()
  }
  return browserClient
}
