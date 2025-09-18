import type { Config } from "drizzle-kit"
import { env } from "@cethos/config"

export default {
  schema: "./src/schema/*",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString:
      env.SUPABASE_URL.replace("https://", "postgresql://postgres:") + `@${env.SUPABASE_URL.split("//")[1]}/postgres`,
  },
} satisfies Config
