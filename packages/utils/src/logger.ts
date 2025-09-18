import pino from "pino"
import { nanoid } from "nanoid"

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function createRequestId(): string {
  return nanoid(12)
}

export function withRequestId<T extends Record<string, any>>(requestId: string, data: T): T & { requestId: string } {
  return { ...data, requestId }
}
