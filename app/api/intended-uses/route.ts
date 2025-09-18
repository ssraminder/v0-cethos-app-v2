import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return mock data for now
    const intendedUses = [
      {
        id: "1",
        name: "Immigration Documents",
        certification_type_id: "cert-1",
        certification_types: {
          id: "cert-1",
          name: "Certified Translation",
          price_cents: 2500,
        },
      },
      {
        id: "2",
        name: "Academic Transcripts",
        certification_type_id: "cert-1",
        certification_types: {
          id: "cert-1",
          name: "Certified Translation",
          price_cents: 2500,
        },
      },
    ]

    return NextResponse.json({ intendedUses })
  } catch (error) {
    console.error("[v0] Intended uses API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
