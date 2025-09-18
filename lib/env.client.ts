"use client"

export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

let cached: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error(
      'ENV_CHECK {"level":"ERROR","op":"getPublicEnv","code":"MISSING_PUBLIC_SUPABASE_ENVS","ts":"' +
        new Date().toISOString() +
        '"}',
    )
    throw new Error("Missing public Supabase envs.")
  }
  cached = { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key }
  console.log(
    'ENV_CHECK {"level":"INFO","op":"getPublicEnv","message":"Public env loaded","ts":"' +
      new Date().toISOString() +
      '"}',
  )
  return cached
}
