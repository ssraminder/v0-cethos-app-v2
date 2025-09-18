import { type NextRequest, NextResponse } from "next/server"
import { getEnv } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    const e = getEnv()
    return NextResponse.json({
      ok: true,
      supabaseUrlPresent: !!e.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyPresent: !!e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ts: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_SUPABASE_ENVS",
        message: err?.message || "Missing envs",
        ts: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
