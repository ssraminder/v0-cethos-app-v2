import { createBrowserClient, createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { env } from "@cethos/config"

/**
 * Create a Supabase client for browser-side operations
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

/**
 * Create a Supabase client for server-side operations
 */
export function createSupabaseServerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: "", ...options })
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })
}

/**
 * Create a Supabase service client for admin operations
 */
export function createSupabaseServiceClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
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
