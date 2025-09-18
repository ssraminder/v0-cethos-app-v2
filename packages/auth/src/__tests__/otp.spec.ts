import { describe, it, expect, beforeEach, vi } from "vitest"
import { OTPManager } from "../otp/manager"

// Mock environment variables
vi.mock("@cethos/config", () => ({
  env: {
    FEATURE_USE_PROVIDER_OTP: false,
    BREVO_API_KEY: "test-key",
    BREVO_FROM_EMAIL: "test@example.com",
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe("OTP Manager", () => {
  let otpManager: OTPManager

  beforeEach(() => {
    otpManager = new OTPManager()
    vi.clearAllMocks()
  })

  describe("requestOTP", () => {
    it("should send email OTP when provider OTP is disabled", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(""),
      } as Response)

      const result = await otpManager.requestOTP("test@example.com")

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", expect.any(Object))
    })

    it("should validate email format", async () => {
      const result = await otpManager.requestOTP("invalid-email")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid email format")
    })

    it("should enforce rate limiting", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(""),
      } as Response)

      // Make 5 requests (should be allowed)
      for (let i = 0; i < 5; i++) {
        const result = await otpManager.requestOTP("test@example.com")
        expect(result.success).toBe(true)
      }

      // 6th request should be rate limited
      const result = await otpManager.requestOTP("test@example.com")
      expect(result.success).toBe(false)
      expect(result.error).toContain("Too many attempts")
    })
  })

  describe("verifyOTP", () => {
    it("should verify correct OTP code", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(""),
      } as Response)

      // Request OTP first
      await otpManager.requestOTP("test@example.com")

      // Mock the code generation to return a known value
      const originalGenerate = (otpManager as any).generateCode
      ;(otpManager as any).generateCode = () => "123456"

      // Request again with mocked code
      await otpManager.requestOTP("test2@example.com")

      // Verify with correct code
      const result = await otpManager.verifyOTP("test2@example.com", "123456")
      expect(result.success).toBe(true)

      // Restore original method
      ;(otpManager as any).generateCode = originalGenerate
    })

    it("should reject incorrect OTP code", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(""),
      } as Response)

      await otpManager.requestOTP("test@example.com")

      const result = await otpManager.verifyOTP("test@example.com", "wrong-code")
      expect(result.success).toBe(false)
      expect(result.error).toBe("Invalid code")
      expect(result.remainingAttempts).toBe(2)
    })

    it("should handle non-existent OTP request", async () => {
      const result = await otpManager.verifyOTP("nonexistent@example.com", "123456")
      expect(result.success).toBe(false)
      expect(result.error).toBe("Invalid or expired code")
    })
  })
})
