import { type NextRequest, NextResponse } from "next/server"

function log(level: "INFO" | "ERROR", op: string, data: any) {
  const logEntry = {
    level,
    op,
    ts: new Date().toISOString(),
    ...data,
  }
  console.log(`PHASE1_OCR ${JSON.stringify(logEntry)}`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.test !== "ping") {
      log("ERROR", "selftest", { code: "BAD_INPUT", message: 'Expected test: "ping"' })
      return NextResponse.json({ code: "BAD_INPUT", message: 'Expected test: "ping"' }, { status: 400 })
    }

    const response = {
      ok: true,
      ts: new Date().toISOString(),
    }

    log("INFO", "selftest", { message: "Self-test ping successful" })
    return NextResponse.json(response)
  } catch (error: any) {
    log("ERROR", "selftest", {
      code: "INTERNAL_ERROR",
      message: error.message || "Self-test failed",
    })

    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Self-test failed" }, { status: 500 })
  }
}
