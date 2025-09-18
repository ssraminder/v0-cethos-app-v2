import { env } from "@cethos/config"
import { logger } from "@cethos/utils"
import type { OTPProvider } from "./types"

export class BrevoEmailOTPProvider implements OTPProvider {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = env.BREVO_API_KEY
    this.fromEmail = env.BREVO_FROM_EMAIL
  }

  async sendOTP(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          sender: {
            email: this.fromEmail,
            name: "Cethos",
          },
          to: [{ email }],
          subject: "Your Cethos verification code",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Verification Code</h2>
              <p>Your verification code is:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error("Brevo email send failed:", error)
        return { success: false, error: "Failed to send email" }
      }

      logger.info("OTP email sent successfully", { email })
      return { success: true }
    } catch (error) {
      logger.error("Error sending OTP email:", error)
      return { success: false, error: "Failed to send email" }
    }
  }

  validateIdentifier(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  getProviderName(): string {
    return "email"
  }
}
