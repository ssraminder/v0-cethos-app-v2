// Type definition
export type ServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

// Cache variable
let cachedServer:
  | (Required<Pick<ServerEnv, "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY">> & ServerEnv)
  | null = null

// Function implementation
function getServerEnvImpl() {
  if (cachedServer) return cachedServer

  const ep = (n: string) => process.env[n as keyof NodeJS.ProcessEnv]

  const snap: ServerEnv = {
    NEXT_PUBLIC_SUPABASE_URL: ep("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ep("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_URL: ep("SUPABASE_URL"),
    SUPABASE_ANON_KEY: ep("SUPABASE_ANON_KEY"),
  }

  const url = snap.NEXT_PUBLIC_SUPABASE_URL || snap.SUPABASE_URL
  const key = snap.NEXT_PUBLIC_SUPABASE_ANON_KEY || snap.SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(
      'ENV_CHECK {"level":"ERROR","op":"getServerEnv","code":"MISSING_SUPABASE_ENVS","url":' +
        JSON.stringify(url) +
        ',"key":' +
        JSON.stringify(!!key ? "***" : undefined) +
        ',"ts":"' +
        new Date().toISOString() +
        '"}',
    )
    throw new Error("Missing Supabase environment variables.")
  }

  cachedServer = {
    ...snap,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
  }

  console.log(
    'ENV_CHECK {"level":"INFO","op":"getServerEnv","message":"Server env loaded","ts":"' +
      new Date().toISOString() +
      '"}',
  )

  return cachedServer
}

// Named export
export const getServerEnv = getServerEnvImpl

// Alternative export syntax for maximum compatibility;
