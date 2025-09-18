export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { initDocAI } from "@/lib/docai"

function log(level: "INFO" | "ERROR", op: string, data: any) {
  const logEntry = {
    level,
    op,
    ts: new Date().toISOString(),
    ...data,
  }
  console.log(`PHASE1_OCR ${JSON.stringify(logEntry)}`)
}

export async function GET() {
  const status = {
    phase1_enabled: process.env.PHASE1_OCR_ENABLED === "1",
    timestamp: new Date().toISOString(),
    environment: {
      gcp_project_id: !!process.env.GCP_PROJECT_ID,
      doc_ai_location: !!process.env.DOC_AI_LOCATION,
      doc_ai_processor_id: !!process.env.DOC_AI_PROCESSOR_ID,
      google_credentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      gcs_bucket: !!process.env.GCS_BUCKET,
      ocr_max_text_length: process.env.OCR_MAX_TEXT_LENGTH || "500000",
      download_timeout_ms: process.env.DOWNLOAD_TIMEOUT_MS || "60000",
    },
    docai_client: null as any,
  }

  // Test DocAI client initialization if enabled
  if (status.phase1_enabled) {
    try {
      const client = initDocAI()
      status.docai_client = { status: "initialized", error: null }
      log("INFO", "health_check", { message: "DocAI client test successful" })
    } catch (error: any) {
      status.docai_client = { status: "failed", error: error.message || "Unknown error" }
      log("ERROR", "health_check", {
        message: "DocAI client test failed",
        error: error.message,
        code: error.code,
      })
    }
  } else {
    status.docai_client = { status: "disabled", error: null }
  }

  const allEnvsPresent =
    status.environment.gcp_project_id &&
    status.environment.doc_ai_location &&
    status.environment.doc_ai_processor_id &&
    status.environment.google_credentials

  const overallStatus =
    status.phase1_enabled && allEnvsPresent && status.docai_client.status === "initialized" ? "healthy" : "degraded"

  log("INFO", "health_check", {
    message: "Health check completed",
    status: overallStatus,
    phase1_enabled: status.phase1_enabled,
    envs_present: allEnvsPresent,
  })

  return NextResponse.json({
    status: overallStatus,
    ...status,
  })
}
