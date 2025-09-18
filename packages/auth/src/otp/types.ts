export interface OTPProvider {
  sendOTP(identifier: string, code: string): Promise<{ success: boolean; error?: string }>
  validateIdentifier(identifier: string): boolean
  getProviderName(): string
}

export interface OTPRequest {
  identifier: string // email or phone
  code: string
  expiresAt: Date
  attempts: number
  maxAttempts: number
}

export interface OTPResult {
  success: boolean
  error?: string
  remainingAttempts?: number
}
