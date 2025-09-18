import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: languages, error } = await supabase.from("languages").select("*").eq("is_active", true).order("name")

    if (error) throw error

    return NextResponse.json({ languages })
  } catch (error) {
    console.error("Languages fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 })
  }
}
