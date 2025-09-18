import { z } from "zod"

const envSchema = z.object({
  // Site Configuration
  PUBLIC_SITE_URL: z.string().url(),
  CORS_ALLOWED_ORIGINS: z.string().default("https://cethos.com,https://*.cethos.com,https://*.vercel.app"),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Google Cloud Platform
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string(),
  GCP_PROJECT_ID: z.string(),
  GCS_BUCKET: z.string().default("cethos-ocr"),
  GCS_ARCHIVE_BUCKET: z.string().optional(),

  // Document AI
  DOC_AI_LOCATION: z.string().default("us"),
  DOC_AI_PROCESSOR_ID: z.string(),

  // Gemini AI
  GEMINI_API_KEY: z.string(),
  GEMINI_MODEL: z.string().default("gemini-1.5-pro"),

  // Email & SMS
  BREVO_API_KEY: z.string(),
  BREVO_FROM_EMAIL: z.string().email(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),

  // Feature Flags & Business Rules
  FEATURE_USE_PROVIDER_OTP: z.coerce.boolean().default(false),
  PAYMENT_MODE: z.enum(["capture", "authorize"]).default("capture"),
  ROUNDING_THRESHOLD: z.coerce.number().default(0.2),
  TAX_DEFAULT_COUNTRY: z.string().default("CA"),

  // Storage Lifecycle
  STORAGE_NEARLINE_AFTER_DAYS: z.coerce.number().default(30),
  STORAGE_ARCHIVE_AFTER_DAYS: z.coerce.number().default(90),

  // Development
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error("❌ Invalid environment variables:", error)
    process.exit(1)
  }
}

export const env = validateEnv()
