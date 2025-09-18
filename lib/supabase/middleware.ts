import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { getServerEnv } from "@/lib/environment.server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getServerEnv()

    console.log("[v0] Using supabaseUrl:", NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Using supabaseAnonKey:", NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***" : "undefined")

    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("[v0] Error in middleware auth check:", error)
  }

  return supabaseResponse
}
