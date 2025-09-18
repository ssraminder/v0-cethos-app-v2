import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createQuoteSchema = z.object({
  sourceLanguageId: z.string().uuid(),
  targetLanguageId: z.string().uuid(),
  serviceType: z.enum(["translation", "interpretation", "certification", "proofreading"]),
  urgencyLevel: z.enum(["standard", "urgent", "rush", "same_day"]),
  certificationRequired: z.boolean(),
  files: z.array(
    z.object({
      filename: z.string(),
      size: z.number(),
      mimeType: z.string(),
      wordCount: z.number().optional(),
      pageCount: z.number().optional(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const validatedData = createQuoteSchema.parse(body)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const quoteNumber = `Q${Date.now()}`

    const totalWordCount = validatedData.files.reduce((sum, file) => sum + (file.wordCount || 0), 0)
    const totalPageCount = validatedData.files.reduce((sum, file) => sum + (file.pageCount || 0), 0)

    const { data: pricingTier } = await supabase
      .from("pricing_tiers")
      .select("*")
      .lte("min_words", totalWordCount)
      .gte("max_words", totalWordCount)
      .eq("is_active", true)
      .single()

    const { data: languagePair } = await supabase
      .from("language_pairs")
      .select("*")
      .eq("source_language_id", validatedData.sourceLanguageId)
      .eq("target_language_id", validatedData.targetLanguageId)
      .eq("is_active", true)
      .single()

    const baseRate = pricingTier?.rate_per_word || 0.15
    const baseAmount = totalWordCount * baseRate

    let urgencyMultiplier = 1
    if (languagePair) {
      switch (validatedData.urgencyLevel) {
        case "urgent":
          urgencyMultiplier = Number(languagePair.urgent_multiplier)
          break
        case "rush":
          urgencyMultiplier = Number(languagePair.rush_multiplier)
          break
        case "same_day":
          urgencyMultiplier = Number(languagePair.same_day_multiplier)
          break
      }
    }

    const rushAmount = baseAmount * (urgencyMultiplier - 1)
    const certificationAmount = validatedData.certificationRequired ? baseAmount * 0.25 : 0

    const { data: taxRegion } = await supabase
      .from("tax_regions")
      .select("*")
      .eq("region_code", "ON")
      .eq("is_active", true)
      .single()

    const subtotal = baseAmount + rushAmount + certificationAmount
    const taxAmount = subtotal * (Number(taxRegion?.tax_rate) || 0.13)
    const totalAmount = subtotal + taxAmount

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        customer_id: user?.id || null,
        quote_number: quoteNumber,
        source_language_id: validatedData.sourceLanguageId,
        target_language_id: validatedData.targetLanguageId,
        service_type: validatedData.serviceType,
        urgency_level: validatedData.urgencyLevel,
        certification_type: validatedData.certificationRequired ? "certified" : null,
        word_count: totalWordCount,
        page_count: totalPageCount,
        base_amount: baseAmount,
        rush_amount: rushAmount,
        certification_amount: certificationAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: "draft",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .select()
      .single()

    if (quoteError) throw quoteError

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
  }
}
