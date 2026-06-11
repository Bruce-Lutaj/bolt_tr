import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface SmartUserLoginResponse {
  userId: string
  email: string
  token?: string
}

async function callSmartUserLogin(email: string, password: string): Promise<SmartUserLoginResponse> {
  const appId = Deno.env.get("SMARTUSER_APP_ID")
  const appSecret = Deno.env.get("SMARTUSER_APP_SECRET")
  const env = Deno.env.get("SMARTUSER_ENV") ?? "STAG"
  const baseUrl = Deno.env.get("SMARTUSER_API_BASE_URL")

  if (!appId || !appSecret) {
    throw new Error("SmartUser API credentials are not configured (SMARTUSER_APP_ID, SMARTUSER_APP_SECRET)")
  }
  if (!baseUrl) {
    throw new Error("SmartUser API endpoint is not configured (SMARTUSER_API_BASE_URL)")
  }

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Id": appId,
      "X-App-Secret": appSecret,
      "X-Environment": env,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const body = await response.text()
    let message = "Login failed"
    try {
      const parsed = JSON.parse(body)
      message = parsed.error ?? parsed.message ?? message
    } catch { /* use default */ }
    throw new Error(message)
  }

  const data = await response.json()

  const userId = data.userId ?? data.user_id ?? data.id ?? data.obfuscatedReference
  if (!userId) {
    throw new Error("SmartUser API did not return a user identifier")
  }

  return {
    userId: String(userId),
    email,
    token: data.token ?? data.sessionToken ?? undefined,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
    if (!password || typeof password !== "string") {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const result = await callSmartUserLogin(email, password)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    const status = message.includes("not configured") ? 503 : 401
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
