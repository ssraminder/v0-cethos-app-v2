import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "@cethos/config"
import * as schema from "./schema"

// Create connection string from Supabase URL
const connectionString = `postgresql://postgres:${env.SUPABASE_SERVICE_ROLE_KEY}@${env.SUPABASE_URL.split("//")[1]}/postgres`

const client = postgres(connectionString, { max: 1 })
export const db = drizzle(client, { schema })

export type Database = typeof db
