export {
  createSupabaseBrowserClient,
  createSupabaseServerClient,
  createSupabaseServiceClient,
  getSupabaseBrowserClient,
} from "./supabase"

export { getOTPManager, OTPManager } from "./otp/manager"
export { BrevoEmailOTPProvider } from "./otp/email-provider"
export { TwilioSMSOTPProvider } from "./otp/sms-provider"
export type { OTPProvider, OTPRequest, OTPResult } from "./otp/types"

export { getUserProfile, hasPermission, getUserPermissions, type SessionUser } from "./session"
export { updateSession } from "./middleware"
