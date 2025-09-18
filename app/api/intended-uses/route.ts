import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: intendedUses, error } = await supabase
      .from("intended_uses")
      .select(`
        id,
        name,
        certification_type_id,
        certification_types (
          id,
          name,
          price_cents
        )
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching intended uses:", error)
      return NextResponse.json({ error: "Failed to fetch intended uses" }, { status: 500 })
    }

    return NextResponse.json({ intendedUses })
  } catch (error) {
    console.error("[v0] Intended uses API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
