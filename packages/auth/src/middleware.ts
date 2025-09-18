import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "./supabase"
import { logger } from "@cethos/utils"

/**
 * Middleware to refresh Supabase session
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseServerClient(request, response)

  try {
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
