export type EnvSnapshot = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_URL?: string // mirrors for Edge/middleware
  SUPABASE_ANON_KEY?: string
}

let cached: EnvSnapshot | null = null

export function getEnv(): Required<Pick<EnvSnapshot, "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY">> &
  EnvSnapshot {
  if (cached) return cached as any
  const ep = (n: string) => process.env[n]

  const snap: EnvSnapshot = {
    NEXT_PUBLIC_SUPABASE_URL: ep("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ep("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_URL: ep("SUPABASE_URL"),
    SUPABASE_ANON_KEY: ep("SUPABASE_ANON_KEY"),
  }

  // Prefer NEXT_PUBLIC_*; fall back to mirrors for Edge/middleware
  const url = snap.NEXT_PUBLIC_SUPABASE_URL || snap.SUPABASE_URL
  const key = snap.NEXT_PUBLIC_SUPABASE_ANON_KEY || snap.SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(
      'ENV_CHECK {"level":"ERROR","op":"getEnv","code":"MISSING_SUPABASE_ENVS","url":' +
        JSON.stringify(url) +
        ',"key":' +
        JSON.stringify(!!key ? "***" : undefined) +
        ',"ts":"' +
        new Date().toISOString() +
        '"}',
    )
    throw new Error("Missing Supabase environment variables. Please check your project configuration.")
  }

  cached = { ...snap, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key }
  console.log(
    'ENV_CHECK {"level":"INFO","op":"getEnv","message":"Supabase env loaded","ts":"' + new Date().toISOString() + '"}',
  )
  return cached as any
}
