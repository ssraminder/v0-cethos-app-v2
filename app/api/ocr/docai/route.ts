import { type NextRequest, NextResponse } from "next/server"
import { initDocAI, runDocAI } from "@/lib/docai"

interface OCRRequest {
  quote_id: string
  files: Array<{
    url: string
    name: string
    mime: string
  }>
}

function log(level: "INFO" | "ERROR", op: string, data: any) {
  const logEntry = {
    level,
    op,
    ts: new Date().toISOString(),
    ...data,
  }
  console.log(`PHASE1_OCR ${JSON.stringify(logEntry)}`)
}

async function downloadFile(url: string, timeoutMs = 30000): Promise<Buffer> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Cethos-OCR/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    clearTimeout(timeoutId)
    return buffer
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Download timeout")
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (process.env.PHASE1_OCR_ENABLED !== "1") {
      log("INFO", "docai_api", { message: "Feature disabled", code: "FEATURE_DISABLED" })
      return NextResponse.json({ code: "FEATURE_DISABLED", message: "Phase 1 OCR disabled" }, { status: 503 })
    }

    // Parse request
    let body: OCRRequest
    try {
      body = await request.json()
    } catch (error) {
      log("ERROR", "docai_api", { code: "BAD_INPUT", message: "Invalid JSON in request body" })
      return NextResponse.json({ code: "BAD_INPUT", message: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate request
    if (!body.quote_id || !Array.isArray(body.files) || body.files.length === 0) {
      log("ERROR", "docai_api", { code: "BAD_INPUT", message: "Missing quote_id or files array" })
      return NextResponse.json({ code: "BAD_INPUT", message: "Missing quote_id or files array" }, { status: 400 })
    }

    // Initialize DocAI client
    let client
    try {
      client = initDocAI()
    } catch (error: any) {
      return NextResponse.json(error, { status: 500 })
    }

    const downloadTimeoutMs = Number.parseInt(process.env.DOWNLOAD_TIMEOUT_MS || "30000")
    const results = []
    let totalPages = 0
    let totalTokens = 0

    // Process each file
    for (const file of body.files) {
      try {
        log("INFO", "docai_api", {
          message: "Starting file processing",
          quote_id: body.quote_id,
          file: file.name,
          url: file.url,
        })

        // Download file
        let buffer: Buffer
        try {
          buffer = await downloadFile(file.url, downloadTimeoutMs)
        } catch (error: any) {
          const downloadError = {
            code: "DOWNLOAD_FAILED",
            message: `Failed to download ${file.name}: ${error.message}`,
            file: file.name,
          }
          log("ERROR", "docai_api", { ...downloadError, quote_id: body.quote_id })
          return NextResponse.json(downloadError, { status: 400 })
        }

        // Process with DocAI
        const result = await runDocAI(client, { buffer, mime: file.mime, filename: file.name }, body.quote_id)

        // Set the original URL
        result.file.url = file.url

        results.push(result)
        totalPages += result.ocr.pages
        totalTokens += result.ocr.tokens
      } catch (error: any) {
        if (error.code) {
          return NextResponse.json(error, { status: 500 })
        }

        const internalError = {
          code: "INTERNAL_ERROR",
          message: `Failed to process ${file.name}: ${error.message}`,
        }
        log("ERROR", "docai_api", { ...internalError, quote_id: body.quote_id })
        return NextResponse.json(internalError, { status: 500 })
      }
    }

    const response = {
      quote_id: body.quote_id,
      results,
      summary: {
        totalFiles: results.length,
        totalPages,
        totalTokens,
      },
    }

    log("INFO", "docai_api", {
      message: "Processing complete",
      quote_id: body.quote_id,
      totalFiles: results.length,
      totalPages,
      totalTokens,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    const internalError = {
      code: "INTERNAL_ERROR",
      message: error.message || "Internal server error",
    }
    log("ERROR", "docai_api", internalError)
    return NextResponse.json(internalError, { status: 500 })
  }
}
