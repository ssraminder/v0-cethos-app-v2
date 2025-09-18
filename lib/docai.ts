import { DocumentProcessorServiceClient } from "@google-cloud/documentai"

interface DocAIConfig {
  projectId: string
  location: string
  processorId: string
  credentials: any
}

interface ProcessResult {
  file: {
    name: string
    url: string
    mime: string
  }
  ocr: {
    pages: number
    tokens: number
    text: string
    blocks: any[]
  }
  metadata: {
    processorId: string
    runtimeMs: number
  }
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

export function initDocAI(): DocumentProcessorServiceClient {
  try {
    // Check required environment variables
    const projectId = process.env.GCP_PROJECT_ID
    const location = process.env.DOC_AI_LOCATION
    const processorId = process.env.DOC_AI_PROCESSOR_ID
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

    if (!projectId) {
      const error = { code: "ENV_MISSING", message: "GCP_PROJECT_ID missing", hint: "Set GCP_PROJECT_ID in Vercel env" }
      log("ERROR", "initDocAI", error)
      throw error
    }

    if (!location) {
      const error = {
        code: "ENV_MISSING",
        message: "DOC_AI_LOCATION missing",
        hint: "Set DOC_AI_LOCATION in Vercel env",
      }
      log("ERROR", "initDocAI", error)
      throw error
    }

    if (!processorId) {
      const error = {
        code: "ENV_MISSING",
        message: "DOC_AI_PROCESSOR_ID missing",
        hint: "Set DOC_AI_PROCESSOR_ID in Vercel env",
      }
      log("ERROR", "initDocAI", error)
      throw error
    }

    if (!credentialsJson) {
      const error = {
        code: "ENV_MISSING",
        message: "GOOGLE_APPLICATION_CREDENTIALS_JSON missing",
        hint: "Set GOOGLE_APPLICATION_CREDENTIALS_JSON in Vercel env",
      }
      log("ERROR", "initDocAI", error)
      throw error
    }

    // Parse credentials (handle base64 or raw JSON)
    let credentials
    try {
      // Try to decode as base64 first
      const decoded = Buffer.from(credentialsJson, "base64").toString("utf-8")
      credentials = JSON.parse(decoded)
    } catch {
      // If base64 decode fails, treat as raw JSON
      credentials = JSON.parse(credentialsJson)
    }

    const client = new DocumentProcessorServiceClient({
      credentials,
      projectId,
    })

    log("INFO", "initDocAI", { message: "Client initialized" })
    return client
  } catch (error: any) {
    if (error.code) {
      throw error // Re-throw our custom errors
    }
    const customError = { code: "DOC_AI_INIT_FAILED", message: error.message || "Failed to initialize DocAI client" }
    log("ERROR", "initDocAI", customError)
    throw customError
  }
}

export async function runDocAI(
  client: DocumentProcessorServiceClient,
  fileData: { stream?: any; buffer?: Buffer; mime: string; filename: string },
  quoteId?: string,
): Promise<ProcessResult> {
  const startTime = Date.now()

  try {
    const projectId = process.env.GCP_PROJECT_ID!
    const location = process.env.DOC_AI_LOCATION!
    const processorId = process.env.DOC_AI_PROCESSOR_ID!
    const maxTextLength = Number.parseInt(process.env.OCR_MAX_TEXT_LENGTH || "500000")

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    // Convert stream to buffer if needed
    let documentBuffer: Buffer
    if (fileData.buffer) {
      documentBuffer = fileData.buffer
    } else if (fileData.stream) {
      const chunks: Buffer[] = []
      for await (const chunk of fileData.stream) {
        chunks.push(chunk)
      }
      documentBuffer = Buffer.concat(chunks)
    } else {
      throw new Error("Either stream or buffer must be provided")
    }

    const request = {
      name,
      rawDocument: {
        content: documentBuffer,
        mimeType: fileData.mime,
      },
    }

    const [response] = await client.processDocument(request)
    const document = response.document

    if (!document) {
      const error = { code: "DOC_AI_PROCESS_FAILED", message: "No document returned from processor" }
      log("ERROR", "runDocAI", { ...error, quote_id: quoteId, file: fileData.filename })
      throw error
    }

    // Extract text and metadata
    const fullText = document.text || ""
    const pages = document.pages?.length || 0
    const tokens = fullText.split(/\s+/).length

    // Truncate text if over limit
    let finalText = fullText
    const blocks =
      document.pages?.map((page) => ({
        pageNumber: page.pageNumber,
        blocks: page.blocks?.length || 0,
      })) || []

    if (fullText.length > maxTextLength) {
      finalText = fullText.substring(0, maxTextLength)
      log("INFO", "runDocAI", {
        message: "Text truncated",
        quote_id: quoteId,
        file: fileData.filename,
        originalLength: fullText.length,
        truncatedLength: finalText.length,
      })
    }

    const runtimeMs = Date.now() - startTime

    const processResult: ProcessResult = {
      file: {
        name: fileData.filename,
        url: "", // Will be set by caller
        mime: fileData.mime,
      },
      ocr: {
        pages,
        tokens,
        text: finalText,
        blocks,
      },
      metadata: {
        processorId,
        runtimeMs,
      },
    }

    log("INFO", "runDocAI", {
      message: "Processed",
      quote_id: quoteId,
      file: fileData.filename,
      ms: runtimeMs,
      pages,
      tokens,
    })

    return processResult
  } catch (error: any) {
    const runtimeMs = Date.now() - startTime

    if (error.code && error.code.startsWith("DOC_AI_")) {
      throw error // Re-throw our custom errors
    }

    const customError = {
      code: "DOC_AI_PROCESS_FAILED",
      message: error.message || "Document processing failed",
      details: error.details || error.code || "Unknown error",
    }

    log("ERROR", "runDocAI", {
      ...customError,
      quote_id: quoteId,
      file: fileData.filename,
      ms: runtimeMs,
    })

    throw customError
  }
}
