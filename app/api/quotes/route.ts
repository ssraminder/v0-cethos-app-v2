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
    const body = await request.json()
    const validatedData = createQuoteSchema.parse(body)

    const quoteNumber = `Q${Date.now()}`
    const totalWordCount = validatedData.files.reduce((sum, file) => sum + (file.wordCount || 0), 0)
    const totalPageCount = validatedData.files.reduce((sum, file) => sum + (file.pageCount || 0), 0)

    // Mock quote calculation
    const baseRate = 0.15
    const baseAmount = totalWordCount * baseRate
    const urgencyMultiplier = validatedData.urgencyLevel === "urgent" ? 1.5 : 1.0
    const rushAmount = baseAmount * (urgencyMultiplier - 1)
    const certificationAmount = validatedData.certificationRequired ? baseAmount * 0.25 : 0
    const subtotal = baseAmount + rushAmount + certificationAmount
    const taxAmount = subtotal * 0.13
    const totalAmount = subtotal + taxAmount

    const quote = {
      id: `quote-${Date.now()}`,
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
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
  }
}
