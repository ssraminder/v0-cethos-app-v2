import { nanoid } from "nanoid"
import { env } from "@cethos/config"
import { logger } from "@cethos/utils"
import { BrevoEmailOTPProvider } from "./email-provider"
import { TwilioSMSOTPProvider } from "./sms-provider"
import type { OTPProvider, OTPRequest, OTPResult } from "./types"

// In-memory store for OTP requests (in production, use Redis or database)
const otpStore = new Map<string, OTPRequest>()
const rateLimitStore = new Map<string, { attempts: number; resetAt: Date }>()

export class OTPManager {
  private emailProvider: BrevoEmailOTPProvider
  private smsProvider: TwilioSMSOTPProvider | null

  constructor() {
    this.emailProvider = new BrevoEmailOTPProvider()

    // Initialize SMS provider if Twilio is configured
    try {
      this.smsProvider = new TwilioSMSOTPProvider()
    } catch {
      this.smsProvider = null
      logger.info("SMS OTP disabled - Twilio not configured")
    }
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Get the appropriate provider based on identifier and settings
   */
  private getProvider(identifier: string): OTPProvider {
    const isEmail = identifier.includes("@")
    const isPhone = identifier.startsWith("+")

    // If provider OTP is enabled and we have SMS capability
    if (env.FEATURE_USE_PROVIDER_OTP && this.smsProvider && isPhone) {
      return this.smsProvider
    }

    // Fall back to email for everything else
    return this.emailProvider
  }

  /**
   * Check rate limiting for an identifier
   */
  private checkRateLimit(identifier: string): { allowed: boolean; resetAt?: Date } {
    const key = `rate_limit:${identifier}`
    const limit = rateLimitStore.get(key)

    if (!limit) {
      return { allowed: true }
    }

    if (new Date() > limit.resetAt) {
      rateLimitStore.delete(key)
      return { allowed: true }
    }

    if (limit.attempts >= 5) {
      return { allowed: false, resetAt: limit.resetAt }
    }

    return { allowed: true }
  }

  /**
   * Update rate limiting for an identifier
   */
  private updateRateLimit(identifier: string): void {
    const key = `rate_limit:${identifier}`
    const existing = rateLimitStore.get(key)

    if (!existing || new Date() > existing.resetAt) {
      rateLimitStore.set(key, {
        attempts: 1,
        resetAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      })
    } else {
      existing.attempts++
    }
  }

  /**
   * Request an OTP code
   */
  async requestOTP(identifier: string, ipAddress?: string): Promise<OTPResult> {
    // Check rate limiting
    const rateLimit = this.checkRateLimit(identifier)
    if (!rateLimit.allowed) {
      logger.warn("OTP rate limit exceeded", { identifier, ipAddress })
      return {
        success: false,
        error: `Too many attempts. Try again after ${rateLimit.resetAt?.toLocaleTimeString()}`,
      }
    }

    // Get appropriate provider
    const provider = this.getProvider(identifier)

    // Validate identifier format
    if (!provider.validateIdentifier(identifier)) {
      return {
        success: false,
        error: `Invalid ${provider.getProviderName()} format`,
      }
    }

    // Generate code and create request
    const code = this.generateCode()
    const requestId = nanoid()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const otpRequest: OTPRequest = {
      identifier,
      code,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
    }

    // Send OTP
    const sendResult = await provider.sendOTP(identifier, code)
    if (!sendResult.success) {
      return sendResult
    }

    // Store request
    otpStore.set(requestId, otpRequest)
    this.updateRateLimit(identifier)

    logger.info("OTP requested", {
      identifier,
      provider: provider.getProviderName(),
      requestId,
      ipAddress,
    })

    return { success: true }
  }

  /**
   * Verify an OTP code
   */
  async verifyOTP(identifier: string, code: string, ipAddress?: string): Promise<OTPResult> {
    // Find matching OTP request
    let matchingRequest: OTPRequest | null = null
    let requestId: string | null = null

    for (const [id, request] of otpStore.entries()) {
      if (request.identifier === identifier) {
        matchingRequest = request
        requestId = id
        break
      }
    }

    if (!matchingRequest || !requestId) {
      logger.warn("OTP verification failed - no request found", { identifier, ipAddress })
      return { success: false, error: "Invalid or expired code" }
    }

    // Check expiration
    if (new Date() > matchingRequest.expiresAt) {
      otpStore.delete(requestId)
      logger.warn("OTP verification failed - expired", { identifier, ipAddress })
      return { success: false, error: "Code has expired" }
    }

    // Check attempts
    if (matchingRequest.attempts >= matchingRequest.maxAttempts) {
      otpStore.delete(requestId)
      logger.warn("OTP verification failed - max attempts", { identifier, ipAddress })
      return { success: false, error: "Too many failed attempts" }
    }

    // Verify code
    if (matchingRequest.code !== code) {
      matchingRequest.attempts++
      const remainingAttempts = matchingRequest.maxAttempts - matchingRequest.attempts

      logger.warn("OTP verification failed - wrong code", {
        identifier,
        attempts: matchingRequest.attempts,
        ipAddress,
      })

      if (remainingAttempts <= 0) {
        otpStore.delete(requestId)
        return { success: false, error: "Too many failed attempts" }
      }

      return {
        success: false,
        error: "Invalid code",
        remainingAttempts,
      }
    }

    // Success - clean up
    otpStore.delete(requestId)

    logger.info("OTP verified successfully", { identifier, ipAddress })

    return { success: true }
  }

  /**
   * Clean up expired OTP requests (should be called periodically)
   */
  cleanup(): void {
    const now = new Date()
    let cleaned = 0

    for (const [id, request] of otpStore.entries()) {
      if (now > request.expiresAt) {
        otpStore.delete(id)
        cleaned++
      }
    }

    // Clean up expired rate limits
    for (const [key, limit] of rateLimitStore.entries()) {
      if (now > limit.resetAt) {
        rateLimitStore.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info("OTP cleanup completed", { cleaned })
    }
  }
}

// Singleton instance
let otpManager: OTPManager | null = null

export function getOTPManager(): OTPManager {
  if (!otpManager) {
    otpManager = new OTPManager()
  }
  return otpManager
}
