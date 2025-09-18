import { env } from "@cethos/config"
import { logger } from "@cethos/utils"
import type { OTPProvider } from "./types"

export class TwilioSMSOTPProvider implements OTPProvider {
  private accountSid: string
  private authToken: string
  private messagingServiceSid: string

  constructor() {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_MESSAGING_SERVICE_SID) {
      throw new Error("Twilio credentials not configured")
    }

    this.accountSid = env.TWILIO_ACCOUNT_SID
    this.authToken = env.TWILIO_AUTH_TOKEN
    this.messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID
  }

  async sendOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          MessagingServiceSid: this.messagingServiceSid,
          To: phone,
          Body: `Your Cethos verification code is: ${code}. This code expires in 10 minutes.`,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error("Twilio SMS send failed:", error)
        return { success: false, error: "Failed to send SMS" }
      }

      logger.info("OTP SMS sent successfully", { phone })
      return { success: true }
    } catch (error) {
      logger.error("Error sending OTP SMS:", error)
      return { success: false, error: "Failed to send SMS" }
    }
  }

  validateIdentifier(phone: string): boolean {
    // Basic phone validation - should start with + and contain only digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
  }

  getProviderName(): string {
    return "sms"
  }
}
