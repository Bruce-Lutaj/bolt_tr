const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SESSION_KEY = 'gymtrack.smartuser.session'

export interface SmartUserSessionData {
  userId: string
  email: string
  token?: string
  expiresAt?: string
}

function readSession(): SmartUserSessionData | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SmartUserSessionData
  } catch {
    return null
  }
}

function writeSession(session: SmartUserSessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

async function safeParseJson(response: Response): Promise<{ data: Record<string, unknown> | null; parseError: string | null }> {
  const text = await response.text()
  if (!text || text.trim().length === 0) {
    return { data: null, parseError: 'Empty response from server' }
  }
  try {
    const parsed = JSON.parse(text)
    return { data: parsed, parseError: null }
  } catch {
    return { data: null, parseError: 'Invalid JSON response from server' }
  }
}

async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: SmartUserSessionData | null; error: string | null }> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }

  const { data: json, parseError } = await safeParseJson(response)

  if (parseError) {
    return { data: null, error: parseError }
  }

  if (!response.ok) {
    const errMsg = (json?.error as string) ?? `Request failed (${response.status})`
    return { data: null, error: errMsg }
  }

  if (!json?.userId) {
    return { data: null, error: 'Server did not return a valid user identity' }
  }

  return {
    data: {
      userId: json.userId as string,
      email: (json.email as string) ?? '',
      token: (json.token as string) ?? undefined,
      expiresAt: (json.expiresAt as string) ?? undefined,
    },
    error: null,
  }
}

export async function smartUserLogin(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await callEdgeFunction('smartuser-login', { email, password })
  if (error || !data) {
    return { userId: null, error: error ?? 'Login failed' }
  }
  writeSession(data)
  return { userId: data.userId, error: null }
}

export async function smartUserSignup(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await callEdgeFunction('smartuser-signup', { email, password })
  if (error || !data) {
    return { userId: null, error: error ?? 'Signup failed' }
  }
  writeSession(data)
  return { userId: data.userId, error: null }
}

export async function validateSmartUserSession(): Promise<{ valid: boolean; session: SmartUserSessionData | null }> {
  const session = readSession()
  if (!session || !session.token) {
    clearSession()
    return { valid: false, session: null }
  }

  const url = `${SUPABASE_URL}/functions/v1/smartuser-session`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token: session.token }),
    })
  } catch {
    clearSession()
    return { valid: false, session: null }
  }

  if (!response.ok) {
    clearSession()
    return { valid: false, session: null }
  }

  const { data: json, parseError } = await safeParseJson(response)
  if (parseError || !json?.userId) {
    clearSession()
    return { valid: false, session: null }
  }

  const refreshed: SmartUserSessionData = {
    userId: json.userId as string,
    email: (json.email as string) ?? session.email,
    token: (json.token as string) ?? session.token,
    expiresAt: (json.expiresAt as string) ?? undefined,
  }
  writeSession(refreshed)
  return { valid: true, session: refreshed }
}

export async function smartUserLogout(): Promise<void> {
  const session = readSession()
  if (session?.token) {
    const url = `${SUPABASE_URL}/functions/v1/smartuser-logout`
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token: session.token }),
      })
    } catch {
      // Best-effort: clear local session regardless
    }
  }
  clearSession()
}

export function getSmartUserSession(): SmartUserSessionData | null {
  return readSession()
}

export function getSmartUserId(): string | null {
  const session = readSession()
  return session?.userId ?? null
}
