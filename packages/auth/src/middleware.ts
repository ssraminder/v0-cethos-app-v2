import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { logger } from "@cethos/utils"

/**
 * Create a Supabase client for middleware operations
 * Directly access environment variables since process.env validation doesn't work in middleware
 */
function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Missing Supabase environment variables in middleware")
    throw new Error("Missing Supabase environment variables")
  }

  console.log("[v0] Using supabaseUrl:", supabaseUrl)
  console.log("[v0] Using supabaseAnonKey:", supabaseAnonKey ? "***" : "undefined")

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
 * Middleware to refresh Supabase session
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createSupabaseMiddlewareClient(request, response)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If user is signed in and the current path is /login, redirect to dashboard
    if (user && request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/portal", request.url))
    }

    // If user is not signed in and the current path requires auth, redirect to login
    const protectedPaths = ["/portal", "/staff"]
    const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    if (!user && isProtectedPath) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return response
  } catch (error) {
    logger.error("Auth middleware error:", error)
    return response
  }
}
