import { NextResponse } from "next/server"

export async function GET() {
  try {
    const languages = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "English",
        code: "en",
        native_name: "English",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Spanish",
        code: "es",
        native_name: "Español",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "French",
        code: "fr",
        native_name: "Français",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "German",
        code: "de",
        native_name: "Deutsch",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Portuguese",
        code: "pt",
        native_name: "Português",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440006",
        name: "Italian",
        code: "it",
        native_name: "Italiano",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        name: "Chinese (Simplified)",
        code: "zh-CN",
        native_name: "简体中文",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440008",
        name: "Japanese",
        code: "ja",
        native_name: "日本語",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        name: "Korean",
        code: "ko",
        native_name: "한국어",
        is_active: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Arabic",
        code: "ar",
        native_name: "العربية",
        is_active: true,
      },
    ]

    return NextResponse.json({ languages })
  } catch (error) {
    console.error("Languages fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 })
  }
}
